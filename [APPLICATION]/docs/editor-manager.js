/**
 * Monaco Editor Manager
 * Encapsulates all Monaco Editor initialization, configuration, and management logic
 */

const EditorManager = {
    editors: {},

    /**
     * Initialize a Monaco editor instance
     * @param {HTMLElement} container - The DOM element to host the editor
     * @param {string} language - The language mode (e.g., 'json', 'csharp')
     * @param {string} theme - Monaco theme name (e.g., 'vs-dark')
     * @param {object} options - Additional Monaco editor options
     * @returns {Promise<monaco.editor.IStandaloneCodeEditor>} - The editor instance
     */
    initializeEditor(container, language, theme = 'vs-dark', options = {}) {
        return new Promise((resolve, reject) => {
            require(['vs/editor/editor.main'], function () {
                try {
                    const defaultOptions = {
                        value: '',
                        language: language,
                        theme: theme,
                        automaticLayout: false, // We'll handle layout manually with ResizeObserver
                        minimap: { enabled: true },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        fontFamily: 'Consolas, "Courier New", monospace',
                        lineNumbers: 'on',
                        folding: true,
                        wordWrap: 'off',
                        renderWhitespace: 'selection',
                        tabSize: 2,
                        insertSpaces: true,
                        formatOnPaste: true,
                        formatOnType: true,
                    };

                    const mergedOptions = { ...defaultOptions, ...options };
                    const editor = monaco.editor.create(container, mergedOptions);

                    // Setup resize observer for this editor
                    EditorManager.setupResizeObserver(editor, container);

                    resolve(editor);
                } catch (error) {
                    reject(error);
                }
            });
        });
    },

    /**
     * Set editor content without triggering change events
     * @param {monaco.editor.IStandaloneCodeEditor} editor - The editor instance
     * @param {string} content - The content to set
     */
    setEditorValue(editor, content) {
        if (!editor) return;

        const model = editor.getModel();
        if (model) {
            // Push edit operation to undo stack
            model.pushEditOperations(
                [],
                [{
                    range: model.getFullModelRange(),
                    text: content
                }],
                () => null
            );
        }
    },

    /**
     * Get current editor content
     * @param {monaco.editor.IStandaloneCodeEditor} editor - The editor instance
     * @returns {string} - The editor content
     */
    getEditorValue(editor) {
        if (!editor) return '';
        return editor.getValue();
    },

    /**
     * Setup ResizeObserver to automatically layout editor on container resize
     * @param {monaco.editor.IStandaloneCodeEditor} editor - The editor instance
     * @param {HTMLElement} container - The container element
     */
    setupResizeObserver(editor, container) {
        if (!editor || !container) return;

        const resizeObserver = new ResizeObserver(() => {
            // Debounce layout calls to avoid excessive reflows
            if (container._layoutTimeout) {
                clearTimeout(container._layoutTimeout);
            }
            container._layoutTimeout = setTimeout(() => {
                editor.layout();
            }, 100);
        });

        resizeObserver.observe(container);

        // Store observer for cleanup
        if (!container._resizeObservers) {
            container._resizeObservers = [];
        }
        container._resizeObservers.push(resizeObserver);
    },

    /**
     * Define custom Monaco themes with accent colors and syntax highlighting
     * Call this once after Monaco is loaded
     */
    defineCustomThemes() {
        // Base editor colors (no glow effects)
        const baseColors = {
            'editor.background': '#1e1e1e',
            'editor.foreground': '#d4d4d4',
            'editorLineNumber.foreground': '#858585',
            'editor.lineHighlightBackground': '#2a2a2a',
            'editorIndentGuide.background': '#404040',
            'editorIndentGuide.activeBackground': '#707070',
            'editorWhitespace.foreground': '#404040',
            'editor.findMatchBackground': '#515c6a',
            'editor.findMatchHighlightBackground': '#515c6a50',
            'editor.rangeHighlightBackground': '#ffffff0b',
            'editorBracketMatch.background': '#0064001a',
            'editorOverviewRuler.border': '#1e1e1e',
            'scrollbar.shadow': '#000000',
            'scrollbarSlider.background': '#79797966',
            'scrollbarSlider.hoverBackground': '#646464b3',
            'scrollbarSlider.activeBackground': '#bfbfbf66',
            'editorSuggestWidget.background': '#252526',
            'editorSuggestWidget.border': '#454545',
            'editorHoverWidget.background': '#252526',
            'editorHoverWidget.border': '#454545',
            'list.hoverBackground': '#2a2d2e',
            'input.background': '#1e1e1e',
            'input.border': '#454545'
        };

        // Orange theme - Warm palette
        monaco.editor.defineTheme('streamerbot-orange', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                // Keywords - Very muted orange
                { token: 'keyword', foreground: 'CC7700', fontStyle: 'bold' },
                { token: 'keyword.control', foreground: 'CC7700', fontStyle: 'bold' },
                { token: 'keyword.operator', foreground: 'AA6633' },

                // Functions - Muted gold
                { token: 'function', foreground: 'B8975F' },
                { token: 'method', foreground: 'B8975F' },

                // Strings - Muted coral
                { token: 'string', foreground: 'C47A5E' },
                { token: 'string.escape', foreground: 'D08866' },

                // Numbers - Very soft orange
                { token: 'number', foreground: 'BBA588' },

                // Comments - Muted tan
                { token: 'comment', foreground: '998866', fontStyle: 'italic' },

                // Types - Muted amber
                { token: 'type', foreground: 'B89030' },
                { token: 'class', foreground: 'B89030' },
                { token: 'interface', foreground: 'B89030' },
                { token: 'namespace', foreground: 'C9A850' },
                { token: 'type.identifier', foreground: 'B89030' },

                // Variables - Medium gray
                { token: 'variable', foreground: 'A8A8A8' },
                { token: 'identifier', foreground: 'A8A8A8' },
                { token: 'variable.predefined', foreground: 'BB8844' },
                { token: 'constant', foreground: 'BB7744' },

                // Delimiters - Gray/Muted gold
                { token: 'delimiter', foreground: '999999' },
                { token: 'delimiter.bracket', foreground: 'A89560' },
                { token: 'delimiter.array', foreground: 'A89560' },
                { token: 'delimiter.parenthesis', foreground: 'A89560' },

                // Annotations - Muted yellow
                { token: 'annotation', foreground: 'C0AA55' },

                // Tags - Muted orange
                { token: 'tag', foreground: 'BB7744' },
                { token: 'attribute.name', foreground: 'B88855' },
                { token: 'attribute.value', foreground: 'C47A5E' },

                // Regexp - Muted red-orange
                { token: 'regexp', foreground: 'BB5544' }
            ],
            colors: {
                ...baseColors,
                'editor.selectionBackground': '#4d4d4d',
                'editor.inactiveSelectionBackground': '#3d3d3d',
                'editorCursor.foreground': '#FF9900',
                'editorLineNumber.activeForeground': '#FF9900',
                'editorBracketMatch.border': '#FFC107',
                'focusBorder': '#FF9900',
                'list.activeSelectionBackground': '#4d4d4d',
                'list.focusBackground': '#3d3d3d',
                'editorSuggestWidget.selectedBackground': '#4d4d4d'
            }
        });

        // Blue theme - Cool palette
        monaco.editor.defineTheme('streamerbot-blue', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                // Keywords - Very muted blue
                { token: 'keyword', foreground: '0077BB', fontStyle: 'bold' },
                { token: 'keyword.control', foreground: '0077BB', fontStyle: 'bold' },
                { token: 'keyword.operator', foreground: '3388BB' },

                // Functions - Muted cyan
                { token: 'function', foreground: '00A8B8' },
                { token: 'method', foreground: '00A8B8' },

                // Strings - Muted blue
                { token: 'string', foreground: '5090C8' },
                { token: 'string.escape', foreground: '7AA5CC' },

                // Numbers - Very soft sky blue
                { token: 'number', foreground: '88A5BB' },

                // Comments - Muted steel blue
                { token: 'comment', foreground: '557799', fontStyle: 'italic' },

                // Types - Muted turquoise
                { token: 'type', foreground: '00A0A0' },
                { token: 'class', foreground: '00A0A0' },
                { token: 'interface', foreground: '00A0A0' },
                { token: 'namespace', foreground: '55B8B8' },
                { token: 'type.identifier', foreground: '00A0A0' },

                // Variables - Medium gray
                { token: 'variable', foreground: 'A8A8A8' },
                { token: 'identifier', foreground: 'A8A8A8' },
                { token: 'variable.predefined', foreground: '4495BB' },
                { token: 'constant', foreground: '3377BB' },

                // Delimiters - Gray/Muted cyan
                { token: 'delimiter', foreground: '999999' },
                { token: 'delimiter.bracket', foreground: '00A0B0' },
                { token: 'delimiter.array', foreground: '00A0B0' },
                { token: 'delimiter.parenthesis', foreground: '00A0B0' },

                // Annotations - Muted cyan
                { token: 'annotation', foreground: '55B8C8' },

                // Tags - Muted blue
                { token: 'tag', foreground: '3377BB' },
                { token: 'attribute.name', foreground: '5588BB' },
                { token: 'attribute.value', foreground: '5090C8' },

                // Regexp - Muted deep blue
                { token: 'regexp', foreground: '4455BB' }
            ],
            colors: {
                ...baseColors,
                'editor.selectionBackground': '#4d4d4d',
                'editor.inactiveSelectionBackground': '#3d3d3d',
                'editorCursor.foreground': '#0099FF',
                'editorLineNumber.activeForeground': '#0099FF',
                'editorBracketMatch.border': '#00CCEE',
                'focusBorder': '#0099FF',
                'list.activeSelectionBackground': '#4d4d4d',
                'list.focusBackground': '#3d3d3d',
                'editorSuggestWidget.selectedBackground': '#4d4d4d'
            }
        });

        // Purple theme - Vibrant palette
        monaco.editor.defineTheme('streamerbot-purple', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                // Keywords - Very muted purple
                { token: 'keyword', foreground: '7733BB', fontStyle: 'bold' },
                { token: 'keyword.control', foreground: '7733BB', fontStyle: 'bold' },
                { token: 'keyword.operator', foreground: '8844BB' },

                // Functions - Muted magenta
                { token: 'function', foreground: 'BB00BB' },
                { token: 'method', foreground: 'BB00BB' },

                // Strings - Muted lavender
                { token: 'string', foreground: 'A077CC' },
                { token: 'string.escape', foreground: 'B088CC' },

                // Numbers - Very soft pink
                { token: 'number', foreground: 'BB88BB' },

                // Comments - Muted violet
                { token: 'comment', foreground: '775599', fontStyle: 'italic' },

                // Types - Muted orchid
                { token: 'type', foreground: 'A055BB' },
                { token: 'class', foreground: 'A055BB' },
                { token: 'interface', foreground: 'A055BB' },
                { token: 'namespace', foreground: 'B077CC' },
                { token: 'type.identifier', foreground: 'A055BB' },

                // Variables - Medium gray
                { token: 'variable', foreground: 'A8A8A8' },
                { token: 'identifier', foreground: 'A8A8A8' },
                { token: 'variable.predefined', foreground: '9544BB' },
                { token: 'constant', foreground: '7733BB' },

                // Delimiters - Gray/Muted purple
                { token: 'delimiter', foreground: '999999' },
                { token: 'delimiter.bracket', foreground: 'A066BB' },
                { token: 'delimiter.array', foreground: 'A066BB' },
                { token: 'delimiter.parenthesis', foreground: 'A066BB' },

                // Annotations - Muted purple
                { token: 'annotation', foreground: 'B055BB' },

                // Tags - Muted purple
                { token: 'tag', foreground: '7733BB' },
                { token: 'attribute.name', foreground: '8844BB' },
                { token: 'attribute.value', foreground: 'A077CC' },

                // Regexp - Muted deep purple
                { token: 'regexp', foreground: '6644BB' }
            ],
            colors: {
                ...baseColors,
                'editor.selectionBackground': '#4d4d4d',
                'editor.inactiveSelectionBackground': '#3d3d3d',
                'editorCursor.foreground': '#9933FF',
                'editorLineNumber.activeForeground': '#9933FF',
                'editorBracketMatch.border': '#CC77FF',
                'focusBorder': '#9933FF',
                'list.activeSelectionBackground': '#4d4d4d',
                'list.focusBackground': '#3d3d3d',
                'editorSuggestWidget.selectedBackground': '#4d4d4d'
            }
        });

        // Green theme - Fresh palette
        monaco.editor.defineTheme('streamerbot-green', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                // Keywords - Very muted green
                { token: 'keyword', foreground: '00A055', fontStyle: 'bold' },
                { token: 'keyword.control', foreground: '00A055', fontStyle: 'bold' },
                { token: 'keyword.operator', foreground: '33AA66' },

                // Functions - Muted lime
                { token: 'function', foreground: '77BB55' },
                { token: 'method', foreground: '77BB55' },

                // Strings - Muted mint
                { token: 'string', foreground: '55BB88' },
                { token: 'string.escape', foreground: '77CC99' },

                // Numbers - Very soft teal
                { token: 'number', foreground: '88BBA5' },

                // Comments - Muted olive
                { token: 'comment', foreground: '779955', fontStyle: 'italic' },

                // Types - Muted emerald
                { token: 'type', foreground: '00B077' },
                { token: 'class', foreground: '00B077' },
                { token: 'interface', foreground: '00B077' },
                { token: 'namespace', foreground: '55BB88' },
                { token: 'type.identifier', foreground: '00B077' },

                // Variables - Medium gray
                { token: 'variable', foreground: 'A8A8A8' },
                { token: 'identifier', foreground: 'A8A8A8' },
                { token: 'variable.predefined', foreground: '44BB77' },
                { token: 'constant', foreground: '33AA66' },

                // Delimiters - Gray/Muted green
                { token: 'delimiter', foreground: '999999' },
                { token: 'delimiter.bracket', foreground: '66BB88' },
                { token: 'delimiter.array', foreground: '66BB88' },
                { token: 'delimiter.parenthesis', foreground: '66BB88' },

                // Annotations - Muted green
                { token: 'annotation', foreground: 'A0BB77' },

                // Tags - Muted green
                { token: 'tag', foreground: '33AA66' },
                { token: 'attribute.name', foreground: '55AA77' },
                { token: 'attribute.value', foreground: '55BB88' },

                // Regexp - Muted forest green
                { token: 'regexp', foreground: '44BB66' }
            ],
            colors: {
                ...baseColors,
                'editor.selectionBackground': '#4d4d4d',
                'editor.inactiveSelectionBackground': '#3d3d3d',
                'editorCursor.foreground': '#00CC66',
                'editorLineNumber.activeForeground': '#00CC66',
                'editorBracketMatch.border': '#77FFAA',
                'focusBorder': '#00CC66',
                'list.activeSelectionBackground': '#4d4d4d',
                'list.focusBackground': '#3d3d3d',
                'editorSuggestWidget.selectedBackground': '#4d4d4d'
            }
        });
    },

    /**
     * Sync Monaco theme with app theme
     * @param {monaco.editor.IStandaloneCodeEditor} editor - The editor instance
     * @param {string} appTheme - The app theme name (e.g., 'orange', 'blue', 'purple', 'green')
     */
    syncTheme(editor, appTheme) {
        if (!editor) return;

        // Map app themes to Monaco themes
        const themeMap = {
            'orange': 'streamerbot-orange',
            'blue': 'streamerbot-blue',
            'purple': 'streamerbot-purple',
            'green': 'streamerbot-green'
        };

        const monacoTheme = themeMap[appTheme] || 'streamerbot-orange';
        monaco.editor.setTheme(monacoTheme);
    },

    /**
     * Configure JSON editor with schema validation
     * @param {monaco.editor.IStandaloneCodeEditor} editor - The editor instance
     * @param {object} schema - JSON Schema object for validation
     */
    configureJsonValidation(editor, schema) {
        if (!editor || !schema) return;

        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: true,
            schemas: [{
                uri: 'http://streamerbot-schema',
                fileMatch: ['*'],
                schema: schema
            }]
        });
    },

    /**
     * Register CPH (Code Processing Helper) autocomplete for C# editor
     * Call this once after Monaco is loaded
     */
    registerCPHAutocomplete() {
        // Register completion provider for C#
        monaco.languages.registerCompletionItemProvider('csharp', {
            triggerCharacters: ['.'],
            provideCompletionItems: (model, position) => {
                const textUntilPosition = model.getValueInRange({
                    startLineNumber: position.lineNumber,
                    startColumn: 1,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                });

                // Check if typing after "CPH." and capture any partial method name
                const match = textUntilPosition.match(/CPH\.(\w*)$/);
                if (!match) {
                    return { suggestions: [] };
                }

                // Get the partial text already typed (if any)
                const partialText = match[1].toLowerCase();

                // CPH method definitions for Streamer.bot (193 methods)
                const cphMethods = [
                    // CORE - Action Queues
                    { name: 'PauseActionQueue', params: 'string name', returns: 'void', description: 'Pause a specific action queue by name' },
                    { name: 'PauseAllActionQueues', params: '', returns: 'void', description: 'Pause all action queues' },
                    { name: 'ResumeActionQueue', params: 'string name, bool clear = false', returns: 'void', description: 'Resume action queue, optionally clear all pending actions before resume' },
                    { name: 'ResumeAllActionQueues', params: 'bool clear = false', returns: 'void', description: 'Resume all paused queues, optionally clear all pending actions before resume' },

                    // CORE - Actions
                    { name: 'ActionExists', params: 'string actionName', returns: 'bool', description: 'Check if an action exists by name' },
                    { name: 'DisableAction', params: 'string actionName', returns: 'void', description: 'Disables an action by name' },
                    { name: 'DisableActionById', params: 'string actionId', returns: 'void', description: 'Disables an action by ID' },
                    { name: 'EnableAction', params: 'string actionName', returns: 'void', description: 'Enables an action by name' },
                    { name: 'EnableActionById', params: 'string actionId', returns: 'void', description: 'Enables an action by ID' },
                    { name: 'GetActions', params: '', returns: 'List<ActionData>', description: 'Returns a list of action data for all available actions' },
                    { name: 'RunAction', params: 'string actionName, bool runImmediately = true', returns: 'bool', description: 'Run an action by name' },
                    { name: 'RunActionById', params: 'string actionId, bool runImmediately = true', returns: 'bool', description: 'Run an action by ID' },
                    { name: 'SendAction', params: 'string action, bool bot = true, bool fallback = true', returns: 'void', description: 'Sends an Action from either the Twitch Broadcaster or Twitch Bot Account' },

                    // CORE - Arguments
                    { name: 'SetArgument', params: 'string variableName, object value', returns: 'void', description: 'Set an argument to be used in subsequent sub-actions' },
                    { name: 'TryGetArg', params: 'string argName, out T value', returns: 'bool', description: 'Load an argument and parse it into a C# variable type' },

                    // CORE - Commands
                    { name: 'CommandAddToAllUserCooldowns', params: 'string commandId, int seconds', returns: 'void', description: 'Add time(seconds) to all current user cooldowns of a command by ID' },
                    { name: 'CommandAddToGlobalCooldown', params: 'string commandId, int seconds', returns: 'void', description: 'Add time(seconds) to current global cooldown of a command by ID' },
                    { name: 'CommandAddToUserCooldown', params: 'string commandId, string userId, Platform platform, int seconds', returns: 'void', description: 'Add time(seconds) to the specified user\'s cooldown of a command by ID' },
                    { name: 'CommandGetCounter', params: 'string commandId', returns: 'int', description: 'Returns the total number of command uses by ID' },
                    { name: 'CommandGetUserCounter', params: 'string userName, Platform platform, string commandId', returns: 'CommandCounter', description: 'Returns the total number of times a user has executed the specified command' },
                    { name: 'CommandGetUserCounterById', params: 'string userId, Platform platform, string commandId', returns: 'CommandCounter', description: 'Returns the total number of times a user has executed the specified command by ID' },
                    { name: 'CommandRemoveAllUserCooldowns', params: 'string commandId', returns: 'void', description: 'Remove all user cooldowns associated with the specified command by ID' },
                    { name: 'CommandRemoveGlobalCooldown', params: 'string commandId', returns: 'void', description: 'Remove global cooldown associated with the specified command by ID' },
                    { name: 'CommandRemoveUserCooldown', params: 'string commandId, string userId, Platform platform', returns: 'void', description: 'Remove the specified user\'s cooldown of a command by ID' },
                    { name: 'CommandResetAllUserCooldowns', params: 'string commandId', returns: 'void', description: 'Reset all users cooldowns on all platforms associated with the specified command by ID' },
                    { name: 'CommandResetAllUserCounters', params: 'string commandId', returns: 'void', description: 'Resets all user counters associated with the specified command by ID' },
                    { name: 'CommandResetCounter', params: 'string commandId', returns: 'void', description: 'Resets the total counter for the given command by ID' },
                    { name: 'CommandResetGlobalCooldown', params: 'string commandId', returns: 'void', description: 'Resets global cooldown of command by ID' },
                    { name: 'CommandResetUserCooldown', params: 'string commandId, string userId, Platform platform', returns: 'void', description: 'Reset the specified user\'s cooldown of a command by ID' },
                    { name: 'CommandResetUserCounter', params: 'string commandId, string userId, Platform platform', returns: 'void', description: 'Resets the counter for a specified user for the given command by ID' },
                    { name: 'CommandResetUsersCounters', params: 'string commandId, Platform platform, bool persisted', returns: 'void', description: 'Resets the total counter for all users of a platform for the given command by ID' },
                    { name: 'CommandSetGlobalCooldownDuration', params: 'string commandId, int seconds', returns: 'void', description: 'Set the global cooldown duration of a command by ID' },
                    { name: 'CommandSetUserCooldownDuration', params: 'string commandId, int seconds', returns: 'void', description: 'Set the user cooldown duration of a command by ID' },
                    { name: 'DisableCommand', params: 'string commandId', returns: 'void', description: 'Disables a command by ID' },
                    { name: 'EnableCommand', params: 'string commandId', returns: 'void', description: 'Enables a command by ID' },
                    { name: 'GetCommands', params: '', returns: 'List<CommandData>', description: 'Returns all commands associated with Streamer.bot instance' },

                    // CORE - Events
                    { name: 'GetEventType', params: '', returns: 'EventType', description: 'Fetch the value of the __source variable' },
                    { name: 'GetSource', params: '', returns: 'EventSource', description: 'Fetch the value of the eventSource variable' },

                    // CORE - Globals
                    { name: 'ClearNonPersistedGlobals', params: '', returns: 'void', description: 'Remove all non-persisted global variables' },
                    { name: 'ClearNonPersistedUserGlobals', params: '', returns: 'void', description: 'Remove all non-persisted global user variables' },
                    { name: 'GetGlobalVar', params: 'string varName, bool persisted = true', returns: 'T', description: 'Fetch a global variable by name' },
                    { name: 'GetGlobalVarValues', params: 'bool persisted = true', returns: 'List<GlobalVariableValue>', description: 'Fetch a list of all global variable values' },
                    { name: 'GetUserVar', params: 'string userName, string varName, bool persisted = true', returns: 'T', description: 'DEPRECATED: Use Twitch and YouTube methods instead' },
                    { name: 'SetGlobalVar', params: 'string varName, object value, bool persisted = true', returns: 'void', description: 'Set the value for a global variable' },
                    { name: 'SetUserVar', params: 'string userName, string varName, object value, bool persisted = true', returns: 'void', description: 'DEPRECATED: Use Twitch and YouTube methods instead' },
                    { name: 'UnsetAllUsersVar', params: 'string varName, bool persisted = true', returns: 'void', description: 'Unset a user variable for ALL users' },
                    { name: 'UnsetGlobalVar', params: 'string varName, bool persisted = true', returns: 'void', description: 'Remove a global variable by name' },
                    { name: 'UnsetUser', params: 'string userName, bool persisted = true', returns: 'void', description: 'DEPRECATED: Use Twitch and YouTube methods instead' },
                    { name: 'UnsetUserVar', params: 'string userName, string varName, bool persisted = true', returns: 'void', description: 'DEPRECATED: Use Twitch and YouTube methods instead' },

                    // CORE - Misc
                    { name: 'Between', params: 'int min, int max', returns: 'int', description: 'Returns a random int value between(including) min and max' },
                    { name: 'GetVersion', params: '', returns: 'string', description: 'Returns the SemVersion of the current Streamer.bot installation' },
                    { name: 'NextDouble', params: '', returns: 'double', description: 'Returns a double type between 0 and 1. Often used for random percentages' },
                    { name: 'Wait', params: 'int milliseconds', returns: 'void', description: 'Make the code wait for specified amount of time in milliseconds' },

                    // CORE - Sounds
                    { name: 'StopAllSoundPlayback', params: '', returns: 'void', description: 'Stops all sounds from playing that were started by Streamer.bot' },
                    { name: 'StopSoundPlayback', params: 'string soundName', returns: 'void', description: 'Stops the currently playing sound from Streamer.bot by name' },

                    // CORE - System
                    { name: 'KeyboardPress', params: 'string keyPress', returns: 'void', description: 'Simulate a keyboard input' },

                    // CORE - Timers
                    { name: 'DisableTimerById', params: 'string timerId', returns: 'void', description: 'Disables selected timer by ID' },
                    { name: 'EnableTimerById', params: 'string timerId', returns: 'void', description: 'Enables selected timer by ID' },
                    { name: 'GetTimerState', params: 'string timerId', returns: 'bool', description: 'Get the state of an existing timer' },
                    { name: 'SetTimerInterval', params: 'string timerId, int seconds', returns: 'void', description: 'Set the interval of an existing timer in seconds' },

                    // CORE - Triggers
                    { name: 'RegisterCustomTrigger', params: 'string triggerName, string eventName, string[] categories', returns: 'bool', description: 'Register a custom trigger' },
                    { name: 'TriggerCodeEvent', params: 'string eventName, bool useArgs = true', returns: 'void', description: 'Triggers a custom code event name' },
                    { name: 'TriggerEvent', params: 'string eventName, bool useArgs = true', returns: 'void', description: 'Trigger custom events that are defined with the Custom Event Trigger' },

                    // CORE - Users/Groups
                    { name: 'AddGroup', params: 'string groupName', returns: 'bool', description: 'Creates a new group with the given name' },
                    { name: 'AddUserIdToGroup', params: 'string userId, Platform platform, string groupName', returns: 'bool', description: 'Add a user by ID to a group' },
                    { name: 'AddUserToGroup', params: 'string userName, Platform platform, string groupName', returns: 'bool', description: 'Add a user by username (login name) to a group' },
                    { name: 'ClearUsersFromGroup', params: 'string groupName', returns: 'bool', description: 'Remove all users from a group' },
                    { name: 'DeleteGroup', params: 'string groupName', returns: 'bool', description: 'Deletes the group matching the provided name' },
                    { name: 'GetGroups', params: '', returns: 'List<string>', description: 'Returns a list of all available groups' },
                    { name: 'GroupExists', params: 'string groupName', returns: 'bool', description: 'Returns bool verifying existence of a group by name' },
                    { name: 'RemoveUserFromGroup', params: 'string userName, Platform platform, string groupName', returns: 'bool', description: 'Remove a user by username (login name) from a group' },
                    { name: 'RemoveUserIdFromGroup', params: 'string userId, Platform platform, string groupName', returns: 'bool', description: 'Remove a user by ID from a group' },
                    { name: 'UserIdInGroup', params: 'string userId, Platform platform, string groupName', returns: 'bool', description: 'Check if a user by ID is a member of a group' },
                    { name: 'UserInGroup', params: 'string userName, Platform platform, string groupName', returns: 'bool', description: 'Check if a user by username (login name) is a member of a group' },
                    { name: 'UsersInGroup', params: 'string groupName', returns: 'List<GroupUser>', description: 'Fetch a list of users in a group' },

                    // CORE - WebSocket
                    { name: 'WebsocketBroadcastJson', params: 'string data', returns: 'void', description: 'Send a JSON payload to all clients connected to the Streamer.bot WebSocket Server' },
                    { name: 'WebsocketBroadcastString', params: 'string data', returns: 'void', description: 'Send a text string to all clients connected to the Streamer.bot WebSocket Server' },
                    { name: 'WebsocketConnect', params: 'int connection', returns: 'void', description: 'Connect a configured WebSocket client' },
                    { name: 'WebsocketCustomServerBroadcast', params: 'string data, string sessionId, int connection', returns: 'void', description: 'Broadcast a message to a custom WebSocket server' },
                    { name: 'WebsocketCustomServerCloseAllSessions', params: 'int connection', returns: 'void', description: 'Disconnect all client sessions from a custom WebSocket server' },
                    { name: 'WebsocketCustomServerCloseSession', params: 'string sessionId, int connection', returns: 'void', description: 'Disconnect a session from a custom WebSocket server' },
                    { name: 'WebsocketCustomServerGetConnectionByName', params: 'string name', returns: 'int', description: 'Get the connection index of a custom WebSocket server' },
                    { name: 'WebsocketCustomServerIsListening', params: 'int connection', returns: 'bool', description: 'Check if a custom WebSocket server is currently listening for connections' },
                    { name: 'WebsocketCustomServerStart', params: 'int connection', returns: 'void', description: 'Start a custom WebSocket server' },
                    { name: 'WebsocketCustomServerStop', params: 'int connection', returns: 'void', description: 'Stop a custom WebSocket server' },
                    { name: 'WebsocketDisconnect', params: 'int connection', returns: 'void', description: 'Disconnect a configured WebSocket client' },
                    { name: 'WebsocketIsConnected', params: 'int connection', returns: 'bool', description: 'Check if a configured WebSocket client is connected' },
                    { name: 'WebsocketSend', params: 'string data, int connection', returns: 'void', description: 'Send data over a configured WebSocket client' },

                    // INTEGRATIONS - Discord
                    { name: 'DiscordPostTextToWebhook', params: 'string webhookUrl, string content, string username = "", string avatarUrl = "", bool textToSpeech = false', returns: 'string', description: 'Send simple text content to Discord webhook' },

                    // KICK
                    { name: 'GetKickUserVar', params: 'string userName, string varName, bool persisted = true', returns: 'T', description: 'Get Kick user variable by username' },
                    { name: 'GetKickUserVarById', params: 'string userId, string varName, bool persisted = true', returns: 'T', description: 'Get Kick user variable by user ID' },
                    { name: 'IncrementAllKickUsersVar', params: 'string varName, object value, bool persisted = true', returns: 'void', description: 'Increment variable for all Kick users' },
                    { name: 'IncrementAllKickUsersVarById', params: 'string varName, object value, bool persisted = true', returns: 'void', description: 'Increment variable for all Kick users by ID' },
                    { name: 'IncrementOrCreateKickUsersVarById', params: 'string userId, string varName, object value, bool persisted = true', returns: 'void', description: 'Increment or create Kick user variable by ID' },
                    { name: 'KickBanUser', params: 'string userName', returns: 'bool', description: 'Ban a user on Kick' },
                    { name: 'KickGetBot', params: '', returns: 'KickUserInfo', description: 'Get info for the connected Kick bot account' },
                    { name: 'KickGetBroadcaster', params: '', returns: 'KickUserInfo', description: 'Get info for the connected Kick broadcaster account' },
                    { name: 'KickReplyToMessage', params: 'string message, string messageId', returns: 'void', description: 'Send a reply to a specific Kick chat message' },
                    { name: 'KickSetCategory', params: 'string category', returns: 'bool', description: 'Set the Kick stream category' },
                    { name: 'KickSetTitle', params: 'string title', returns: 'bool', description: 'Set the Kick stream title' },
                    { name: 'KickTimeoutUser', params: 'string userName, int duration', returns: 'bool', description: 'Timeout a user on Kick' },
                    { name: 'KickUnbanUser', params: 'string userName', returns: 'bool', description: 'Unban a user on Kick' },
                    { name: 'SendKickMessage', params: 'string message', returns: 'void', description: 'Send a message to Kick chat' },
                    { name: 'SetKickUserVar', params: 'string userName, string varName, object value, bool persisted = true', returns: 'void', description: 'Set Kick user variable by username' },
                    { name: 'SetKickUserVarById', params: 'string userId, string varName, object value, bool persisted = true', returns: 'void', description: 'Set Kick user variable by user ID' },
                    { name: 'SetKickUsersVarById', params: 'string userId, string varName, object value, bool persisted = true', returns: 'void', description: 'Set Kick users variable by ID' },
                    { name: 'UnsetKickUserVar', params: 'string userName, string varName, bool persisted = true', returns: 'void', description: 'Unset Kick user variable by username' },
                    { name: 'UnsetKickUserVarById', params: 'string userId, string varName, bool persisted = true', returns: 'void', description: 'Unset Kick user variable by user ID' },

                    // MELD STUDIO
                    { name: 'MeldStudioConnect', params: 'int connection', returns: 'void', description: 'Connect to Meld Studio' },
                    { name: 'MeldStudioDisconnect', params: 'int connection', returns: 'void', description: 'Disconnect from Meld Studio' },
                    { name: 'MeldStudioGetConnectionByName', params: 'string name', returns: 'int', description: 'Get Meld Studio connection index by name' },
                    { name: 'MeldStudioHideLayerByName', params: 'string layerName, int connection', returns: 'void', description: 'Hide a Meld Studio layer by name' },
                    { name: 'MeldStudioIsConnected', params: 'int connection', returns: 'bool', description: 'Check if connected to Meld Studio' },
                    { name: 'MeldStudioShowLayerByName', params: 'string layerName, int connection', returns: 'void', description: 'Show a Meld Studio layer by name' },
                    { name: 'MeldStudioShowScene', params: 'int sceneIndex, int connection', returns: 'void', description: 'Show a Meld Studio scene by index' },
                    { name: 'MeldStudioShowSceneByName', params: 'string sceneName, int connection', returns: 'void', description: 'Show a Meld Studio scene by name' },

                    // OBS STUDIO - Filters
                    { name: 'ObsHideFilter', params: 'string scene, string source, string filterName, int connection = 0', returns: 'void', description: 'Hide an OBS filter' },
                    { name: 'ObsHideScenesFilters', params: 'string scene, string filterName, int connection = 0', returns: 'void', description: 'Hide filters on all sources in an OBS scene' },
                    { name: 'ObsHideSourcesFilters', params: 'string source, string filterName, int connection = 0', returns: 'void', description: 'Hide filters on an OBS source' },
                    { name: 'ObsIsFilterEnabled', params: 'string scene, string source, string filterName, int connection = 0', returns: 'bool', description: 'Check if an OBS filter is enabled' },
                    { name: 'ObsSetFilterState', params: 'string scene, string source, string filterName, int state, int connection = 0', returns: 'void', description: 'Set the state of an OBS filter' },
                    { name: 'ObsSetRandomFilterState', params: 'string scene, string filterName, int state, int connection = 0', returns: 'void', description: 'Set a random OBS filter state' },
                    { name: 'ObsShowFilter', params: 'string scene, string source, string filterName, int connection = 0', returns: 'void', description: 'Show an OBS filter' },
                    { name: 'ObsToggleFilter', params: 'string scene, string source, string filterName, int connection = 0', returns: 'void', description: 'Toggle an OBS filter' },
                    { name: 'ObsSetScene', params: 'string sceneName, int connection = 0', returns: 'bool', description: 'Set the current OBS scene' },
                    { name: 'ObsSetSourceVisibility', params: 'string scene, string source, bool visible, int connection = 0', returns: 'void', description: 'Set source visibility' },
                    { name: 'ObsStartStreaming', params: 'int connection = 0', returns: 'void', description: 'Start OBS streaming' },
                    { name: 'ObsStopStreaming', params: 'int connection = 0', returns: 'void', description: 'Stop OBS streaming' },
                    { name: 'ObsStartRecording', params: 'int connection = 0', returns: 'void', description: 'Start OBS recording' },
                    { name: 'ObsStopRecording', params: 'int connection = 0', returns: 'void', description: 'Stop OBS recording' },
                    { name: 'ObsCreateRecordChapter', params: 'string chapterName = null, int connection = 0', returns: 'void', description: 'Create a recording chapter in OBS' },

                    // TROVO
                    { name: 'IncrementAllTrovoUsersVar', params: 'string varName, object value, bool persisted = true', returns: 'void', description: 'Increment variable for all Trovo users' },
                    { name: 'IncrementOrCreateTrovoUsersVarById', params: 'string userId, string varName, object value, bool persisted = true', returns: 'void', description: 'Increment or create Trovo user variable by ID' },
                    { name: 'IncrementTrovoUsersVarById', params: 'string userId, string varName, object value, bool persisted = true', returns: 'void', description: 'Increment Trovo user variable by ID' },

                    // TWITCH - Channel Rewards
                    { name: 'DisableReward', params: 'string rewardId', returns: 'void', description: 'Disable a Twitch Channel Point Reward owned by Streamer.bot' },
                    { name: 'EnableReward', params: 'string rewardId', returns: 'void', description: 'Enable a Twitch Channel Point Reward owned by Streamer.bot' },
                    { name: 'PauseReward', params: 'string rewardId', returns: 'void', description: 'Pause a Twitch Channel Point Reward owned by Streamer.bot' },
                    { name: 'TwitchGetChannelPointsUsedByUserId', params: 'string userId', returns: 'long', description: 'Get the amount of channel points used by a user' },
                    { name: 'TwitchGetRewardCounter', params: 'string rewardId, bool persisted = true', returns: 'TwitchRewardCounter', description: 'Get the counter of a Twitch reward by ID' },
                    { name: 'TwitchGetRewardUserCounter', params: 'string userName, string rewardId, bool persisted = true', returns: 'TwitchRewardCounter', description: 'Returns reward count of the given reward for a specified Twitch user' },
                    { name: 'TwitchGetRewardUserCounterById', params: 'string userId, string rewardId, bool persisted = true', returns: 'TwitchRewardCounter', description: 'Returns reward count of the given reward for a specified Twitch user by ID' },
                    { name: 'TwitchGetRewardUserCounters', params: 'string rewardId, bool persisted = true', returns: 'List<TwitchRewardCounter>', description: 'Returns a list of Twitch Reward Counters' },
                    { name: 'TwitchGetRewards', params: '', returns: 'List<TwitchReward>', description: 'Returns a list of Twitch Rewards' },
                    { name: 'TwitchRedemptionCancel', params: 'string rewardId, string redemptionId', returns: 'bool', description: 'Refund the Twitch reward and remove it from the reward queue' },
                    { name: 'TwitchRedemptionFulfill', params: 'string rewardId, string redemptionId', returns: 'bool', description: 'Mark Twitch reward as resolved, making the redeem non-refundable' },
                    { name: 'TwitchResetRewardCounter', params: 'string rewardId', returns: 'void', description: 'Reset counter for the specified reward by ID' },
                    { name: 'TwitchResetRewardUserCounters', params: 'string rewardId', returns: 'void', description: 'Reset reward user counters for the specified reward by ID' },
                    { name: 'TwitchResetUserRewardCounter', params: 'string rewardId, string userId', returns: 'void', description: 'Reset user reward counters for the specified reward ID and user ID' },
                    { name: 'TwitchResetUserRewardCounters', params: 'string userId, bool persisted = true', returns: 'void', description: 'Reset all user reward counters for the specified user by ID' },
                    { name: 'UpdateRewardMaxPerStream', params: 'string rewardId, int redeems, bool additive = false', returns: 'void', description: 'Updates the total maximum amount of redemptions per stream for the specified reward' },
                    { name: 'UpdateRewardMaxPerUserPerStream', params: 'string rewardId, int redeems, bool additive = false', returns: 'void', description: 'Updates the total maximum amount of redemptions per stream per user for the specified reward' },

                    // TWITCH - Chat
                    { name: 'SendMessage', params: 'string message, bool useBot = true, bool fallback = true', returns: 'void', description: 'Sends a Twitch chat message using either Twitch Broadcaster or Twitch Bot account' },
                    { name: 'SendWhisper', params: 'string userName, string message, bool bot = true', returns: 'bool', description: 'Send a Twitch Whisper to another user' },
                    { name: 'TwitchAnnounce', params: 'string message, bool useBot = true, string color = "default", bool fallback = true', returns: 'void', description: 'Sends a Twitch announcement with color' },
                    { name: 'TwitchClearChatMessages', params: 'bool bot = true', returns: 'bool', description: 'Clear Twitch Chat' },
                    { name: 'TwitchDeleteChatMessage', params: 'string messageId, bool bot = true', returns: 'bool', description: 'Delete Twitch message via message ID' },
                    { name: 'TwitchReplyToMessage', params: 'string message, string replyId, bool useBot = true, bool fallback = true', returns: 'void', description: 'Send a reply to a specific Twitch chat message' },

                    // TWITCH - Clips
                    { name: 'CreateClip', params: '', returns: 'ClipData', description: 'Create a 30 second Twitch Clip' },
                    { name: 'CreateStreamMarker', params: 'string description', returns: 'StreamMarker', description: 'Create a Stream Marker on Twitch' },
                    { name: 'GetAllClips', params: 'bool featured = false', returns: 'List<ClipData>', description: 'Fetch all clips for the connected Twitch Broadcaster' },
                    { name: 'GetClips', params: 'int count, bool featured = false', returns: 'List<ClipData>', description: 'Fetch a number of clips for the connected Twitch Broadcaster' },
                    { name: 'GetClipsForGame', params: 'string gameId, int count, bool featured = false', returns: 'List<ClipData>', description: 'Fetch clips for a specific game on Twitch' },
                    { name: 'GetClipsForUser', params: 'string userName, int count, bool featured = false', returns: 'List<ClipData>', description: 'Fetch clips for a Twitch user by username' },
                    { name: 'GetClipsForUserById', params: 'string userId, int count, bool featured = false', returns: 'List<ClipData>', description: 'Fetch clips for a Twitch user by user ID' },

                    // TWITCH - Globals
                    { name: 'GetTwitchUserVar', params: 'string userName, string varName, bool persisted = true', returns: 'T', description: 'Get Twitch user variable by username' },
                    { name: 'GetTwitchUserVarById', params: 'string userId, string varName, bool persisted = true', returns: 'T', description: 'Get Twitch user variable by user ID' },
                    { name: 'GetTwitchUsersVar', params: 'string varName, bool persisted = true', returns: 'List<UserVariableValue<T>>', description: 'Get Twitch users variable' },
                    { name: 'IncrementAllTwitchUsersVar', params: 'string varName, object value, bool persisted = true', returns: 'void', description: 'Increment variable for all Twitch users' },
                    { name: 'IncrementOrCreateTwitchUsersVarById', params: 'string userId, string varName, object value, bool persisted = true', returns: 'void', description: 'Increment or create Twitch user variable by ID' },
                    { name: 'IncrementTwitchUsersVarById', params: 'string userId, string varName, object value, bool persisted = true', returns: 'void', description: 'Increment Twitch user variable by ID' },
                    { name: 'SetTwitchUserVar', params: 'string userName, string varName, object value, bool persisted = true', returns: 'void', description: 'Set Twitch user variable by username' },
                    { name: 'SetTwitchUserVarById', params: 'string userId, string varName, object value, bool persisted = true', returns: 'void', description: 'Set Twitch user variable by user ID' },
                    { name: 'UnsetTwitchUserVar', params: 'string userName, string varName, bool persisted = true', returns: 'void', description: 'Unset Twitch user variable by username' },
                    { name: 'UnsetTwitchUserVarById', params: 'string userId, string varName, bool persisted = true', returns: 'void', description: 'Unset Twitch user variable by user ID' },

                    // TWITCH - Moderation
                    { name: 'TwitchAddBlockedTerm', params: 'string term', returns: 'bool', description: 'Add a blocked term to Twitch AutoMod' },
                    { name: 'TwitchApproveAutoHeldMessage', params: 'string messageId', returns: 'bool', description: 'Approve an auto-held message in Twitch' },
                    { name: 'TwitchDenyAutoHeldMessage', params: 'string messageId', returns: 'bool', description: 'Deny an auto-held message in Twitch' },
                    { name: 'TwitchGetBlockedTerms', params: '', returns: 'List<BlockedTerm>', description: 'Get list of blocked terms from Twitch AutoMod' },
                    { name: 'TwitchRemoveBlockedTerm', params: 'string termId', returns: 'bool', description: 'Remove a blocked term from Twitch AutoMod' },
                    { name: 'TwitchWarnUser', params: 'string userId, string reason', returns: 'bool', description: 'Warn a user on Twitch' },
                    { name: 'TwitchBanUser', params: 'string userId, string reason = ""', returns: 'void', description: 'Ban a user on Twitch' },
                    { name: 'TwitchTimeoutUser', params: 'string userId, int duration, string reason = ""', returns: 'void', description: 'Timeout a user on Twitch' },
                    { name: 'TwitchUnbanUser', params: 'string userId', returns: 'void', description: 'Unban a user on Twitch' },

                    // TWITCH - User
                    { name: 'TwitchGetBot', params: '', returns: 'TwitchUserInfo', description: 'Get info for the connected Twitch bot account' },
                    { name: 'TwitchGetBroadcaster', params: '', returns: 'TwitchUserInfo', description: 'Get Twitch user information of connected broadcaster' },
                    { name: 'TwitchGetExtendedUserInfoById', params: 'string userId', returns: 'TwitchUserInfoEx', description: 'Get Twitch extended user information of specified user ID' },

                    // YOUTUBE
                    { name: 'IncrementAllYouTubeUsersVar', params: 'string varName, object value, bool persisted = true', returns: 'void', description: 'Increment variable for all YouTube users' },
                    { name: 'IncrementOrCreateYouTubeUsersVarById', params: 'string userId, string varName, object value, bool persisted = true', returns: 'void', description: 'Increment or create YouTube user variable by ID' },
                    { name: 'IncrementYouTubeUsersVarById', params: 'string userId, string varName, object value, bool persisted = true', returns: 'void', description: 'Increment YouTube user variable by ID' },
                    { name: 'SendYouTubeMessageToLatestMonitored', params: 'string message', returns: 'void', description: 'Send a message to the latest monitored YouTube broadcast' },
                    { name: 'YouTubeAddTags', params: 'string[] tags', returns: 'bool', description: 'Add tags to YouTube broadcast' },
                    { name: 'YouTubeBanUserById', params: 'string userId', returns: 'bool', description: 'Ban a YouTube user by ID' },
                    { name: 'YouTubeBanUserByName', params: 'string userName', returns: 'bool', description: 'Ban a YouTube user by name' },
                    { name: 'YouTubeClearTags', params: '', returns: 'bool', description: 'Clear all tags from YouTube broadcast' },
                    { name: 'YouTubeGetBot', params: '', returns: 'YouTubeUserInfo', description: 'Get info for the connected YouTube bot account' },
                    { name: 'YouTubeGetBroadcaster', params: '', returns: 'YouTubeUserInfo', description: 'Get info for the connected YouTube broadcaster account' },
                    { name: 'YouTubeGetLatestMonitoredBroadcast', params: '', returns: 'YouTubeBroadcast', description: 'Get the latest monitored YouTube broadcast' },
                    { name: 'YouTubeGetMonitoredBroadcasts', params: '', returns: 'List<YouTubeBroadcast>', description: 'Get list of monitored YouTube broadcasts' },
                    { name: 'YouTubeRemoveTags', params: 'string[] tags', returns: 'bool', description: 'Remove tags from YouTube broadcast' },
                    { name: 'YouTubeSetCategory', params: 'string categoryId', returns: 'bool', description: 'Set the YouTube broadcast category' },
                    { name: 'YouTubeSetDescription', params: 'string description', returns: 'bool', description: 'Set the YouTube broadcast description' },
                    { name: 'YouTubeSetMetaData', params: 'string title, string description, string categoryId', returns: 'bool', description: 'Set the YouTube broadcast metadata' },
                    { name: 'YouTubeSetPrivacy', params: 'string privacy', returns: 'bool', description: 'Set the YouTube broadcast privacy' },
                    { name: 'YouTubeSetTitle', params: 'string title', returns: 'bool', description: 'Set the YouTube broadcast title' },
                    { name: 'YouTubeTimeoutUserById', params: 'string userId, int duration', returns: 'bool', description: 'Timeout a YouTube user by ID' },
                    { name: 'YouTubeTimeoutUserByName', params: 'string userName, int duration', returns: 'bool', description: 'Timeout a YouTube user by name' }
                ];

                // Filter methods based on partial text already typed
                const filteredMethods = partialText
                    ? cphMethods.filter(method => method.name.toLowerCase().startsWith(partialText))
                    : cphMethods;

                const suggestions = filteredMethods.map(method => ({
                    label: method.name,
                    kind: monaco.languages.CompletionItemKind.Method,
                    insertText: `${method.name}(${method.params ? '$1' : ''})`,
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: {
                        value: `**${method.name}**(${method.params})\n\n` +
                               `Returns: \`${method.returns}\`\n\n` +
                               `${method.description}\n\n` +
                               `Example:\n\`\`\`csharp\nCPH.${method.name}(${method.params.split(',')[0].split(' ').pop() || ''});\n\`\`\``
                    },
                    detail: `(method) CPH.${method.name}(${method.params}): ${method.returns}`
                }));

                return { suggestions };
            }
        });
    },

    /**
     * Set editor to read-only mode
     * @param {monaco.editor.IStandaloneCodeEditor} editor - The editor instance
     * @param {boolean} readOnly - Whether editor should be read-only
     */
    setReadOnly(editor, readOnly) {
        if (!editor) return;
        editor.updateOptions({ readOnly: readOnly });
    },

    /**
     * Focus the editor
     * @param {monaco.editor.IStandaloneCodeEditor} editor - The editor instance
     */
    focus(editor) {
        if (!editor) return;
        editor.focus();
    },

    /**
     * Format the editor content
     * @param {monaco.editor.IStandaloneCodeEditor} editor - The editor instance
     */
    async format(editor) {
        if (!editor) return;
        await editor.getAction('editor.action.formatDocument').run();
    },

    /**
     * Dispose of an editor instance
     * @param {monaco.editor.IStandaloneCodeEditor} editor - The editor instance
     */
    dispose(editor) {
        if (!editor) return;
        editor.dispose();
    },

    /**
     * Cleanup all resize observers for a container
     * @param {HTMLElement} container - The container element
     */
    cleanupResizeObservers(container) {
        if (!container || !container._resizeObservers) return;

        container._resizeObservers.forEach(observer => observer.disconnect());
        container._resizeObservers = [];
    }
};

// Export for use in app.js
window.EditorManager = EditorManager;
