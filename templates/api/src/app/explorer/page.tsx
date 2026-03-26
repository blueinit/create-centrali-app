"use client";

import { ListTasks } from "./ListTasks";
import { CreateTask } from "./CreateTask";
import { GetTask } from "./GetTask";
import { UpdateTask } from "./UpdateTask";
import { DeleteTask } from "./DeleteTask";

export default function ExplorerPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">API Explorer</h1>
        <p className="mt-1 text-sm text-gray-500">
          Try each endpoint interactively. Responses come from your live API routes.
        </p>
      </div>

      <div className="space-y-4">
        <ListTasks />
        <CreateTask />
        <GetTask />
        <UpdateTask />
        <DeleteTask />
      </div>
    </div>
  );
}
