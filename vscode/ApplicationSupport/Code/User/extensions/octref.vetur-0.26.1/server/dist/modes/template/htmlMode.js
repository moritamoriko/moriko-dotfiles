"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMLMode = void 0;
const languageModelCache_1 = require("../../embeddedSupport/languageModelCache");
const htmlCompletion_1 = require("./services/htmlCompletion");
const htmlHover_1 = require("./services/htmlHover");
const htmlHighlighting_1 = require("./services/htmlHighlighting");
const htmlLinks_1 = require("./services/htmlLinks");
const htmlSymbolsProvider_1 = require("./services/htmlSymbolsProvider");
const htmlFormat_1 = require("./services/htmlFormat");
const htmlValidation_1 = require("./services/htmlValidation");
const htmlDefinition_1 = require("./services/htmlDefinition");
const tagProviders_1 = require("./tagProviders");
const componentInfoTagProvider_1 = require("./tagProviders/componentInfoTagProvider");
class HTMLMode {
    constructor(documentRegions, workspacePath, vueVersion, vueDocuments, vueInfoService) {
        this.vueDocuments = vueDocuments;
        this.vueInfoService = vueInfoService;
        this.tagProviderSettings = tagProviders_1.getTagProviderSettings(workspacePath);
        this.enabledTagProviders = tagProviders_1.getEnabledTagProviders(this.tagProviderSettings);
        this.embeddedDocuments = languageModelCache_1.getLanguageModelCache(10, 60, document => documentRegions.refreshAndGet(document).getSingleLanguageDocument('vue-html'));
        this.lintEngine = htmlValidation_1.createLintEngine(vueVersion);
    }
    getId() {
        return 'html';
    }
    configure(c) {
        this.enabledTagProviders = tagProviders_1.getEnabledTagProviders(this.tagProviderSettings);
        this.config = c;
    }
    doValidation(document) {
        if (this.config.vetur.validation.template) {
            const embedded = this.embeddedDocuments.refreshAndGet(document);
            return htmlValidation_1.doESLintValidation(embedded, this.lintEngine);
        }
        return [];
    }
    doComplete(document, position) {
        const embedded = this.embeddedDocuments.refreshAndGet(document);
        const tagProviders = [...this.enabledTagProviders];
        const info = this.vueInfoService ? this.vueInfoService.getInfo(document) : undefined;
        if (info && info.componentInfo.childComponents) {
            tagProviders.push(componentInfoTagProvider_1.getComponentInfoTagProvider(info.componentInfo.childComponents));
        }
        return htmlCompletion_1.doComplete(embedded, position, this.vueDocuments.refreshAndGet(embedded), tagProviders, this.config.emmet);
    }
    doHover(document, position) {
        const embedded = this.embeddedDocuments.refreshAndGet(document);
        const tagProviders = [...this.enabledTagProviders];
        return htmlHover_1.doHover(embedded, position, this.vueDocuments.refreshAndGet(embedded), tagProviders);
    }
    findDocumentHighlight(document, position) {
        return htmlHighlighting_1.findDocumentHighlights(document, position, this.vueDocuments.refreshAndGet(document));
    }
    findDocumentLinks(document, documentContext) {
        return htmlLinks_1.findDocumentLinks(document, documentContext);
    }
    findDocumentSymbols(document) {
        return htmlSymbolsProvider_1.findDocumentSymbols(document, this.vueDocuments.refreshAndGet(document));
    }
    format(document, range, formattingOptions) {
        return htmlFormat_1.htmlFormat(document, range, this.config.vetur.format);
    }
    findDefinition(document, position) {
        const embedded = this.embeddedDocuments.refreshAndGet(document);
        const info = this.vueInfoService ? this.vueInfoService.getInfo(document) : undefined;
        return htmlDefinition_1.findDefinition(embedded, position, this.vueDocuments.refreshAndGet(embedded), info);
    }
    onDocumentRemoved(document) {
        this.vueDocuments.onDocumentRemoved(document);
    }
    dispose() {
        this.vueDocuments.dispose();
    }
}
exports.HTMLMode = HTMLMode;
//# sourceMappingURL=htmlMode.js.map