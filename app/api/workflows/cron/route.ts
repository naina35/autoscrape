import { getAppUrl } from "@/lib/helper";
import prisma from "@/lib/prisma";
import { WorkflowStatus } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const now = new Date();

  const workflows = await prisma.workflow.findMany({
    select: {
      id: true,
    },
    where: {
      status: WorkflowStatus.PUBLISHED,
      cron: { not: null },
      nextRunAt: {
        lte: now,
      },
    },
  });
  for (const workflow of workflows) {
    await triggerWorkflow(workflow.id);
  }
  return Response.json({ workflowsToRun: workflows.length }, { status: 200 });
}

async function triggerWorkflow(workflowId: string) {
  const triggerApiUrl = getAppUrl(
    `api/workflows/execute?workflowId=${workflowId}`
  );
  try {
    const res = await fetch(triggerApiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.API_SECRET!}`,
      },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`Trigger failed for ${workflowId}, status: ${res.status}`);
    }
  } catch (error: any) {
    console.error(
      "Error triggering workflow with id",
      workflowId,
      ":error->",
      error.message
    );
  }
}

