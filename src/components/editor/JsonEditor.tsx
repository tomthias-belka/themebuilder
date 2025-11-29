import { useCallback, useState, useEffect, useRef } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useThemeStore } from '@/store/themeStore'
import { AlertCircle, Check } from 'lucide-react'

export function JsonEditor() {
  const { tokens, updateTokensFromJson, jsonEditorError, setJsonEditorError } = useThemeStore()
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const [isValid, setIsValid] = useState(true)
  const [localValue, setLocalValue] = useState('')
  const isExternalUpdate = useRef(false)

  // Sync tokens -> editor when tokens change externally
  useEffect(() => {
    if (tokens) {
      const formatted = JSON.stringify(tokens, null, 2)
      // Only update if not caused by editor changes
      if (localValue !== formatted) {
        isExternalUpdate.current = true
        setLocalValue(formatted)
        setJsonEditorError(null)
        setIsValid(true)
      }
    }
  }, [tokens, setJsonEditorError])

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    // Configure JSON validation
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [],
      allowComments: false,
      trailingCommas: 'error'
    })
  }

  const handleChange = useCallback((value: string | undefined) => {
    if (!value) return

    // Skip if this is an external update
    if (isExternalUpdate.current) {
      isExternalUpdate.current = false
      return
    }

    setLocalValue(value)

    // Real-time syntax validation
    try {
      JSON.parse(value)
      setIsValid(true)
      setJsonEditorError(null)
    } catch {
      setIsValid(false)
    }
  }, [setJsonEditorError])

  const handleApplyChanges = useCallback(() => {
    if (!isValid || !localValue) return

    const result = updateTokensFromJson(localValue)
    if (!result.success) {
      setIsValid(false)
    }
  }, [isValid, localValue, updateTokensFromJson])

  if (!tokens) {
    return null
  }

  return (
    <div className="h-full flex flex-col">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <span className="text-sm text-muted-foreground">
          orbit-tokens.json
        </span>
        <div className="flex items-center gap-4">
          {isValid ? (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <Check className="h-4 w-4" />
              Valid JSON
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              Invalid JSON
            </span>
          )}
          <button
            onClick={handleApplyChanges}
            disabled={!isValid}
            className="px-3 py-1 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Changes
          </button>
        </div>
      </div>

      {/* Error alert */}
      {jsonEditorError && (
        <div className="mx-4 mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{jsonEditorError}</span>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language="json"
          value={localValue}
          onChange={handleChange}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
            folding: true,
            foldingStrategy: 'indentation'
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
            </div>
          }
        />
      </div>
    </div>
  )
}
