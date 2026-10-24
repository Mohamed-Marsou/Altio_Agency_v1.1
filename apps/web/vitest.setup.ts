import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Remove what each component test drew, so tests never affect each other.
afterEach(() => cleanup());
