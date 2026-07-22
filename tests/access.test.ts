import { describe, it, expect } from "vitest";
import {
  resolveRole,
  canView,
  canEdit,
  canManage,
} from "@/lib/access";

const OWNER = "user-owner";
const EDITOR = "user-editor";
const VIEWER = "user-viewer";
const STRANGER = "user-stranger";

const doc = {
  ownerId: OWNER,
  shares: [
    { userId: EDITOR, role: "editor" },
    { userId: VIEWER, role: "viewer" },
  ],
};

describe("resolveRole", () => {
  it("recognizes the owner", () => {
    expect(resolveRole(doc, OWNER)).toBe("owner");
  });

  it("recognizes an editor share", () => {
    expect(resolveRole(doc, EDITOR)).toBe("editor");
  });

  it("recognizes a viewer share", () => {
    expect(resolveRole(doc, VIEWER)).toBe("viewer");
  });

  it("returns null for a user with no access", () => {
    expect(resolveRole(doc, STRANGER)).toBeNull();
  });

  it("treats an unknown role string as an editor-level share, not owner", () => {
    const d = { ownerId: OWNER, shares: [{ userId: EDITOR, role: "weird" }] };
    expect(resolveRole(d, EDITOR)).toBe("editor");
  });
});

describe("capability checks", () => {
  it("owner can view, edit, and manage", () => {
    const role = resolveRole(doc, OWNER);
    expect(canView(role)).toBe(true);
    expect(canEdit(role)).toBe(true);
    expect(canManage(role)).toBe(true);
  });

  it("editor can view and edit but not manage sharing", () => {
    const role = resolveRole(doc, EDITOR);
    expect(canView(role)).toBe(true);
    expect(canEdit(role)).toBe(true);
    expect(canManage(role)).toBe(false);
  });

  it("viewer can only view", () => {
    const role = resolveRole(doc, VIEWER);
    expect(canView(role)).toBe(true);
    expect(canEdit(role)).toBe(false);
    expect(canManage(role)).toBe(false);
  });

  it("a stranger can do nothing", () => {
    const role = resolveRole(doc, STRANGER);
    expect(canView(role)).toBe(false);
    expect(canEdit(role)).toBe(false);
    expect(canManage(role)).toBe(false);
  });
});
