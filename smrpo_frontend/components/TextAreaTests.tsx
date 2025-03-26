import { UserStory } from "@/lib/types/user-story-types";
import React, { useRef, useEffect, useState } from "react";
import {updateStory} from "@/lib/actions/user-story-actions";

interface HashtagTextEditorProps {
    input: UserStory
}

const HashtagTextEditor: React.FC<HashtagTextEditorProps> = ({ input }) => {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.innerText = input?.description;
        }
    }, [input]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        if (!editorRef.current) return;

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const startContainer = range.startContainer;
        const startOffset = range.startOffset;

        const content = editorRef.current.innerHTML;

        const processedContent = highlightHashtags(editorRef.current.innerText);

        if (processedContent !== content) {
            editorRef.current.innerHTML = processedContent;

            setTimeout(() => {
                restoreCursorPosition(startContainer, startOffset);
            }, 0);
        }

        const x = updateStory(input);
        console.log(x)
    };

    const highlightHashtags = (text: string): string => {
        const lines = text.split('\n');

        const processedLines = lines.map(line => {
            if (line.trim().startsWith('#')) {
                return `<span class="text-blue-500">${line}</span>`;
            }
            else {
                return line.replace(
                    /#(\w+)/g,
                    '<span class="text-blue-500">#$1</span>'
                );
            }
        });

        return processedLines.join('\n');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();

            const textNode = document.createTextNode("\n\n");

            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(textNode);

                range.setStartAfter(textNode);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            }

            handleInput(e);
            return false;
        }
    };

    const restoreCursorPosition = (startContainer: Node, startOffset: number) => {
        if (!editorRef.current) return;

        const selection = window.getSelection();
        if (!selection) return;

        try {
            const textNodes: Node[] = [];
            const walker = document.createTreeWalker(
                editorRef.current,
                NodeFilter.SHOW_TEXT,
                null
            );

            let node: Node | null;
            while (node = walker.nextNode()) {
                textNodes.push(node);
            }

            if (textNodes.length === 0) {
                const newRange = document.createRange();
                newRange.selectNodeContents(editorRef.current);
                newRange.collapse(false);
                selection.removeAllRanges();
                selection.addRange(newRange);
                return;
            }

            let targetNode = textNodes[0];
            let targetOffset = 0;

            if (startContainer.nodeType === Node.TEXT_NODE && startContainer.textContent) {
                const originalText = startContainer.textContent;
                const originalPrefix = originalText.substring(0, startOffset);

                for (const node of textNodes) {
                    if (node.textContent && node.textContent.includes(originalPrefix)) {
                        targetNode = node;
                        targetOffset = node.textContent.indexOf(originalPrefix) + originalPrefix.length;
                        break;
                    }
                }
            }

            const newRange = document.createRange();
            newRange.setStart(targetNode, Math.min(targetOffset, targetNode.textContent?.length || 0));
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
        } catch (e) {
            console.error("Error restoring cursor:", e);
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 min-h-24 whitespace-pre-wrap break-words"
                />
            </div>
        </div>
    );
};

export default HashtagTextEditor;