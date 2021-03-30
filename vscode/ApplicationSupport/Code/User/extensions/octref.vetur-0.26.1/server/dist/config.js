"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultVLSConfig = void 0;
function getDefaultVLSConfig() {
    return {
        vetur: {
            useWorkspaceDependencies: false,
            validation: {
                template: true,
                style: true,
                script: true
            },
            completion: {
                autoImport: false,
                useScaffoldSnippets: false,
                tagCasing: 'initial',
                scaffoldSnippetSources: {
                    workspace: '💼',
                    user: '🗒️',
                    vetur: '✌'
                }
            },
            grammar: {
                customBlocks: {}
            },
            format: {
                enable: true,
                options: {
                    tabSize: 2,
                    useTabs: false
                },
                defaultFormatter: {},
                defaultFormatterOptions: {},
                scriptInitialIndent: false,
                styleInitialIndent: false
            },
            trace: {
                server: 'off'
            },
            dev: {
                vlsPath: '',
                vlsPort: -1,
                logLevel: 'INFO'
            },
            experimental: {
                templateInterpolationService: false
            }
        },
        css: {},
        html: {
            suggest: {}
        },
        javascript: {
            format: {}
        },
        typescript: {
            format: {}
        },
        emmet: {},
        stylusSupremacy: {}
    };
}
exports.getDefaultVLSConfig = getDefaultVLSConfig;
//# sourceMappingURL=config.js.map