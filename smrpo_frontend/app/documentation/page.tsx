"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";

export default function DocumentationPage() {
    const [markdown, setMarkdown] = useState<string>("Loading documentation...");
    const router = useRouter();

    useEffect(() => {
        fetch("/api/get-documentation")
            .then((res) => res.json())
            .then((data) => setMarkdown(data.content))
            .catch(() => setMarkdown("Failed to load documentation."));
    }, []);

    const handleBack = () => router.back();

    return (
        <div className="container max-w-3xl mx-auto p-6 space-y-4">
            {/* Top Back Button */}
            <div className="flex justify-start">
                <Button onClick={handleBack} variant="outline">
                    ← Nazaj
                </Button>
            </div>

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

            {/* Bottom Back Button */}
            <div className="flex justify-start">
                <Button onClick={handleBack} variant="outline">
                    ← Nazaj
                </Button>
            </div>
        </div>
    );
}
