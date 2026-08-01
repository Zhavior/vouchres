import React from "react";

type Props = {
  children: React.ReactNode;
};

export default function WorkspaceShell({ children }: Props) {
  return <>{children}</>;
}
