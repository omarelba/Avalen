// Passwords: at least 8 characters (no 12-character rule, no short maximum), checked
// the same way in the app and on the server, with a strength estimate for the meter.
import test from "node:test";
import assert from "node:assert/strict";
import { passwordStrength, PASSWORD_MIN, PASSWORD_MAX, PASSWORD_LEVELS } from "../src/avalen/validation.js";
import { fixture } from "./helpers/service.js";

test("strength runs weak, fair, good, strong and never praises a short or common password", () => {
  assert.equal(PASSWORD_MIN, 8);
  assert.equal(PASSWORD_MAX, 200);
  assert.deepEqual(PASSWORD_LEVELS, ["Weak", "Fair", "Good", "Strong"]);
  assert.equal(passwordStrength(""), null);
  assert.equal(passwordStrength("abc"), 0, "below the minimum is weak");
  assert.equal(passwordStrength("password1"), 0, "a common word is weak");
  assert.equal(passwordStrength("aaaaaaaaaa"), 0);
  assert.equal(passwordStrength("Abcdefgh1"), 1);
  assert.equal(passwordStrength("Fadel2026!"), 2);
  assert.equal(passwordStrength("correct horse battery"), 3);
});

test("the server accepts an 8-character password and refuses 7", async () => {
  const f = await fixture();
  try {
    const seven = await f.call("/api/signup/coach", { method: "POST", body: { name: "Seven", email: "seven@test.app", password: "Abcde1!" } });
    assert.equal(seven.status, 400);
    const eight = await f.call("/api/signup/coach", { method: "POST", body: { name: "Eight", email: "eight@test.app", password: "Abcde12!" } });
    assert.equal(eight.status, 200, eight.error);
    const login = await f.call("/api/login", { method: "POST", body: { email: "eight@test.app", password: "Abcde12!" } });
    assert.equal(login.status, 200, "an 8-character password signs in");
  } finally {
    await f.close();
  }
});
