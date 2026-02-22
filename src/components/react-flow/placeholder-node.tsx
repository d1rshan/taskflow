"use client";

import { Handle, type NodeProps, Position } from "@xyflow/react";
import type { ReactNode } from "react";

import { BaseNode } from "./base-node";

export type PlaceholderNodeProps = Partial<NodeProps> & {
  children?: ReactNode;
  onClick?: () => void;
};

export function PlaceholderNode({ children, onClick }: PlaceholderNodeProps) {
  return (
    <BaseNode
      className="text-muted-foreground h-auto w-auto cursor-pointer border-dashed p-4 text-center shadow-none hover:border-primary/70 hover:bg-accent/40 hover:text-foreground"
      onClick={onClick}
    >
      {children}
      <Handle
        type="target"
        style={{ visibility: "hidden" }}
        position={Position.Top}
        isConnectable={false}
      />
      <Handle
        type="source"
        style={{ visibility: "hidden" }}
        position={Position.Bottom}
        isConnectable={false}
      />
    </BaseNode>
  );
}
