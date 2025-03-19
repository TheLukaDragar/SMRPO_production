"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function DocumentationPage() {
    const [markdown, setMarkdown] = useState<string>("Loading documentation...");

    useEffect(() => {
        fetch("/api/get-documentation")
            .then((res) => res.json())
            .then((data) => setMarkdown(data.content))
            .catch(() => setMarkdown("Failed to load documentation."));
    }, []);

    return (
        <div className="container max-w-3xl mx-auto p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Documentation</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="prose prose-lg max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                h1: ({ children }) => <h1 className="text-3xl font-bold">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-2xl font-semibold mt-4">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-xl font-semibold mt-3">{children}</h3>,
                                p: ({ children }) => <p className="text-gray-700">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc pl-6">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-6">{children}</ol>,
                                li: ({ children }) => <li className="mb-1">{children}</li>,
                            }}
                        >
                            {markdown}
                        </ReactMarkdown>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
