import { db } from "@/lib/db";
import { getCurrentMatOpsUser } from "@/lib/mat-ops/auth";
import { redirect } from "next/navigation";
import { GlassCard } from "@/components/primitives/GlassCard";
import { BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MatOpsKnowledgePage() {
    const user = await getCurrentMatOpsUser();
    if (!user) redirect("/sign-in");
    if (user.role !== "admin") redirect("/mat-ops/today");

    const articles = await db.query.knowledgeBase.findMany({
        orderBy: (kb, { desc }) => [desc(kb.updatedAt)],
    });

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
                <span className="text-sm text-muted-foreground">
                    {articles.length} article{articles.length !== 1 ? "s" : ""}
                </span>
            </div>

            {articles.length === 0 ? (
                <GlassCard className="p-12 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                        <BookOpen className="h-8 w-8 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">No Articles Yet</h2>
                    <p className="text-muted-foreground">
                        Knowledge base articles help train the AI assistant.
                    </p>
                </GlassCard>
            ) : (
                <div className="space-y-4">
                    {articles.map((article) => (
                        <GlassCard key={article.id} className="p-6">
                            <h2 className="text-lg font-semibold mb-2">{article.title}</h2>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                                {article.content}
                            </p>
                            <div className="mt-4 text-xs text-muted-foreground">
                                Updated: {new Date(article.updatedAt).toLocaleDateString()}
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
