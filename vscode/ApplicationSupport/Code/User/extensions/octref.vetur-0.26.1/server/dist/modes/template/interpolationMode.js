"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VueInterpolationMode = void 0;
const vscode_languageserver_types_1 = require("vscode-languageserver-types");
const javascript_1 = require("../script/javascript");
const paths_1 = require("../../utils/paths");
const sourceMap_1 = require("../../services/typescriptService/sourceMap");
const ts = require("typescript");
const _ = require("lodash");
const templateDiagnosticFilter_1 = require("../../services/typescriptService/templateDiagnosticFilter");
const nullMode_1 = require("../nullMode");
const util_1 = require("../../services/typescriptService/util");
const isInsideInterpolation_1 = require("./services/isInsideInterpolation");
class VueInterpolationMode {
    constructor(tsModule, serviceHost, vueDocuments) {
        this.tsModule = tsModule;
        this.serviceHost = serviceHost;
        this.vueDocuments = vueDocuments;
        this.config = {};
    }
    getId() {
        return 'vue-html-interpolation';
    }
    configure(c) {
        this.config = c;
    }
    queryVirtualFileInfo(fileName, currFileText) {
        return this.serviceHost.queryVirtualFileInfo(fileName, currFileText);
    }
    doValidation(document) {
        if (!_.get(this.config, ['vetur', 'experimental', 'templateInterpolationService'], true)) {
            return [];
        }
        // Add suffix to process this doc as vue template.
        const templateDoc = vscode_languageserver_types_1.TextDocument.create(document.uri + '.template', document.languageId, document.version, document.getText());
        const { templateService, templateSourceMap } = this.serviceHost.updateCurrentVirtualVueTextDocument(templateDoc);
        if (!javascript_1.languageServiceIncludesFile(templateService, templateDoc.uri)) {
            return [];
        }
        const templateFileFsPath = paths_1.getFileFsPath(templateDoc.uri);
        // We don't need syntactic diagnostics because
        // compiled template is always valid JavaScript syntax.
        const rawTemplateDiagnostics = templateService.getSemanticDiagnostics(templateFileFsPath);
        const templateDiagnosticFilter = templateDiagnosticFilter_1.createTemplateDiagnosticFilter(this.tsModule);
        return rawTemplateDiagnostics.filter(templateDiagnosticFilter).map(diag => {
            // syntactic/semantic diagnostic always has start and length
            // so we can safely cast diag to TextSpan
            return {
                range: sourceMap_1.mapBackRange(templateDoc, diag, templateSourceMap),
                severity: vscode_languageserver_types_1.DiagnosticSeverity.Error,
                message: ts.flattenDiagnosticMessageText(diag.messageText, '\n'),
                code: diag.code,
                source: 'Vetur'
            };
        });
    }
    doComplete(document, position) {
        if (!_.get(this.config, ['vetur', 'experimental', 'templateInterpolationService'], true)) {
            return nullMode_1.NULL_COMPLETION;
        }
        const offset = document.offsetAt(position);
        const node = this.vueDocuments.refreshAndGet(document).findNodeBefore(offset);
        const nodeRange = vscode_languageserver_types_1.Range.create(document.positionAt(node.start), document.positionAt(node.end));
        const nodeText = document.getText(nodeRange);
        if (!isInsideInterpolation_1.isInsideInterpolation(node, nodeText, offset - node.start)) {
            return nullMode_1.NULL_COMPLETION;
        }
        // Add suffix to process this doc as vue template.
        const templateDoc = vscode_languageserver_types_1.TextDocument.create(document.uri + '.template', document.languageId, document.version, document.getText());
        const { templateService, templateSourceMap } = this.serviceHost.updateCurrentVirtualVueTextDocument(templateDoc);
        if (!javascript_1.languageServiceIncludesFile(templateService, templateDoc.uri)) {
            return nullMode_1.NULL_COMPLETION;
        }
        /**
         * In the cases of empty content inside node
         * For example, completion in {{ | }}
         * Source map would only map this position {{|  }}
         * And position mapped back wouldn't fall into any source map ranges
         */
        let completionPos = position;
        // Case {{ }}
        if (node.isInterpolation) {
            if (nodeText.match(/{{\s*}}/)) {
                completionPos = document.positionAt(node.start + '{{'.length);
            }
        }
        // Todo: Case v-, : or @ directives
        const mappedOffset = sourceMap_1.mapFromPositionToOffset(templateDoc, completionPos, templateSourceMap);
        const templateFileFsPath = paths_1.getFileFsPath(templateDoc.uri);
        const completions = templateService.getCompletionsAtPosition(templateFileFsPath, mappedOffset, {
            includeCompletionsWithInsertText: true,
            includeCompletionsForModuleExports: false
        });
        if (!completions) {
            return nullMode_1.NULL_COMPLETION;
        }
        const tsItems = completions.entries.map((entry, index) => {
            return {
                uri: templateDoc.uri,
                position,
                label: entry.name,
                sortText: entry.name.startsWith('$') ? '1' + entry.sortText : '0' + entry.sortText,
                kind: util_1.toCompletionItemKind(entry.kind),
                textEdit: entry.replacementSpan &&
                    vscode_languageserver_types_1.TextEdit.replace(sourceMap_1.mapBackRange(templateDoc, entry.replacementSpan, templateSourceMap), entry.name),
                data: {
                    // data used for resolving item details (see 'doResolve')
                    languageId: 'vue-html',
                    uri: templateDoc.uri,
                    offset: position,
                    source: entry.source
                }
            };
        });
        return {
            isIncomplete: false,
            items: tsItems
        };
    }
    doResolve(document, item) {
        if (!_.get(this.config, ['vetur', 'experimental', 'templateInterpolationService'], true)) {
            return item;
        }
        /**
         * resolve is called for both HTMl and interpolation completions
         * HTML completions send back no data
         */
        if (!item.data) {
            return item;
        }
        // Add suffix to process this doc as vue template.
        const templateDoc = vscode_languageserver_types_1.TextDocument.create(document.uri + '.template', document.languageId, document.version, document.getText());
        const { templateService, templateSourceMap } = this.serviceHost.updateCurrentVirtualVueTextDocument(templateDoc);
        if (!javascript_1.languageServiceIncludesFile(templateService, templateDoc.uri)) {
            return item;
        }
        const templateFileFsPath = paths_1.getFileFsPath(templateDoc.uri);
        const mappedOffset = sourceMap_1.mapFromPositionToOffset(templateDoc, item.data.offset, templateSourceMap);
        const details = templateService.getCompletionEntryDetails(templateFileFsPath, mappedOffset, item.label, undefined, undefined, undefined);
        if (details) {
            item.detail = ts.displayPartsToString(details.displayParts);
            item.documentation = ts.displayPartsToString(details.documentation);
            delete item.data;
        }
        return item;
    }
    doHover(document, position) {
        if (!_.get(this.config, ['vetur', 'experimental', 'templateInterpolationService'], true)) {
            return { contents: [] };
        }
        // Add suffix to process this doc as vue template.
        const templateDoc = vscode_languageserver_types_1.TextDocument.create(document.uri + '.template', document.languageId, document.version, document.getText());
        const { templateService, templateSourceMap } = this.serviceHost.updateCurrentVirtualVueTextDocument(templateDoc);
        if (!javascript_1.languageServiceIncludesFile(templateService, templateDoc.uri)) {
            return {
                contents: []
            };
        }
        const templateFileFsPath = paths_1.getFileFsPath(templateDoc.uri);
        const mappedPosition = sourceMap_1.mapFromPositionToOffset(templateDoc, position, templateSourceMap);
        const info = templateService.getQuickInfoAtPosition(templateFileFsPath, mappedPosition);
        if (info) {
            const display = this.tsModule.displayPartsToString(info.displayParts);
            const doc = this.tsModule.displayPartsToString(info.documentation);
            const markedContents = [{ language: 'ts', value: display }];
            if (doc) {
                markedContents.unshift(doc, '\n');
            }
            return {
                range: sourceMap_1.mapBackRange(templateDoc, info.textSpan, templateSourceMap),
                contents: markedContents
            };
        }
        return { contents: [] };
    }
    findDefinition(document, position) {
        if (!_.get(this.config, ['vetur', 'experimental', 'templateInterpolationService'], true)) {
            return [];
        }
        // Add suffix to process this doc as vue template.
        const templateDoc = vscode_languageserver_types_1.TextDocument.create(document.uri + '.template', document.languageId, document.version, document.getText());
        const { templateService, templateSourceMap } = this.serviceHost.updateCurrentVirtualVueTextDocument(templateDoc);
        if (!javascript_1.languageServiceIncludesFile(templateService, templateDoc.uri)) {
            return [];
        }
        const templateFileFsPath = paths_1.getFileFsPath(templateDoc.uri);
        const mappedPosition = sourceMap_1.mapFromPositionToOffset(templateDoc, position, templateSourceMap);
        const definitions = templateService.getDefinitionAtPosition(templateFileFsPath, mappedPosition);
        if (!definitions) {
            return [];
        }
        const definitionResults = [];
        const program = templateService.getProgram();
        if (!program) {
            return [];
        }
        definitions.forEach(r => {
            const definitionTargetDoc = r.fileName === templateFileFsPath ? document : getSourceDoc(r.fileName, program);
            if (definitionTargetDoc) {
                const range = r.fileName === templateFileFsPath
                    ? sourceMap_1.mapBackRange(templateDoc, r.textSpan, templateSourceMap)
                    : convertRange(definitionTargetDoc, r.textSpan);
                definitionResults.push({
                    uri: definitionTargetDoc.uri.toString(),
                    range
                });
            }
        });
        return definitionResults;
    }
    findReferences(document, position) {
        if (!_.get(this.config, ['vetur', 'experimental', 'templateInterpolationService'], true)) {
            return [];
        }
        // Add suffix to process this doc as vue template.
        const templateDoc = vscode_languageserver_types_1.TextDocument.create(document.uri + '.template', document.languageId, document.version, document.getText());
        const { templateService, templateSourceMap } = this.serviceHost.updateCurrentVirtualVueTextDocument(templateDoc);
        if (!javascript_1.languageServiceIncludesFile(templateService, templateDoc.uri)) {
            return [];
        }
        const templateFileFsPath = paths_1.getFileFsPath(templateDoc.uri);
        const mappedPosition = sourceMap_1.mapFromPositionToOffset(templateDoc, position, templateSourceMap);
        const references = templateService.getReferencesAtPosition(templateFileFsPath, mappedPosition);
        if (!references) {
            return [];
        }
        const referenceResults = [];
        const program = templateService.getProgram();
        if (!program) {
            return [];
        }
        references.forEach(r => {
            const referenceTargetDoc = r.fileName === templateFileFsPath ? document : getSourceDoc(r.fileName, program);
            if (referenceTargetDoc) {
                const range = r.fileName === templateFileFsPath
                    ? sourceMap_1.mapBackRange(templateDoc, r.textSpan, templateSourceMap)
                    : convertRange(referenceTargetDoc, r.textSpan);
                referenceResults.push({
                    uri: referenceTargetDoc.uri.toString(),
                    range
                });
            }
        });
        return referenceResults;
    }
    onDocumentRemoved() { }
    dispose() { }
}
exports.VueInterpolationMode = VueInterpolationMode;
function getSourceDoc(fileName, program) {
    const sourceFile = program.getSourceFile(fileName);
    return vscode_languageserver_types_1.TextDocument.create(fileName, 'vue', 0, sourceFile.getFullText());
}
function convertRange(document, span) {
    const startPosition = document.positionAt(span.start);
    const endPosition = document.positionAt(span.start + span.length);
    return vscode_languageserver_types_1.Range.create(startPosition, endPosition);
}
//# sourceMappingURL=interpolationMode.js.map