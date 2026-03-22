import { getCurrentMatOpsUser } from "@/lib/mat-ops/auth";
import { redirect } from "next/navigation";
import { GlassCard } from "@/components/primitives/GlassCard";
import { MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MatOpsChatPage() {
    const user = await getCurrentMatOpsUser();
    if (!user) redirect("/sign-in");

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Mat Ops Chat</h1>

            <GlassCard className="p-12 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                    <MessageSquare className="h-8 w-8 text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold mb-2">AI Assistant</h2>
                <p className="text-muted-foreground mb-6">
                    Chat with the AI assistant for help with operations, proposals, and more.
                </p>
                <p className="text-sm text-muted-foreground">
                    Chat functionality coming soon. This page will include the full chat interface from Mat Ops.
                </p>
            </GlassCard>
        </div>
    );
}
