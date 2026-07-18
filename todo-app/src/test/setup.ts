import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount each rendered screen so tests do not interact with an earlier test's UI.
afterEach(cleanup);
