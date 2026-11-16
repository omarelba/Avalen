// The food library and coaches' own foods.
import test from "node:test";
import assert from "node:assert/strict";
import { ALL_FOODS, EVERYDAY_FOODS, searchFoods } from "../src/avalen/food-library.js";
import { customFoodError } from "../src/avalen/validation.js";
import { weightOf } from "../src/avalen/portions.js";
import arLibrary from "../src/avalen/locales/ar/library.js";
import { workspaceChanges } from "../src/avalen/ecosystem/changes.js";
import { fixture } from "./helpers/service.js";

test("the food library has over 200 foods, each named once, weighed and translated", () => {
  assert.ok(ALL_FOODS.length >= 200, `${ALL_FOODS.length} foods`);
  const names = ALL_FOODS.map((f) => f.name);
  assert.equal(new Set(names).size, names.length, "no food is listed twice");
  for (const food of EVERYDAY_FOODS) {
    assert.ok(weightOf(food.portion), `${food.name} has a weight in its portion`);
    assert.ok(arLibrary[food.name], `${food.name} has an Arabic name`);
    for (const key of ["kcal", "p", "c", "f"]) assert.ok(Number.isFinite(food[key]) && food[key] >= 0, `${food.name} ${key}`);
  }
});

test("food search finds new foods in English, Arabic and common spellings", () => {
  assert.ok(searchFoods(ALL_FOODS, "tilapia").some((f) => f.name === "Grilled tilapia"));
  assert.ok(searchFoods(ALL_FOODS, "بلطي").some((f) => f.name === "Grilled tilapia"));
  assert.ok(searchFoods(ALL_FOODS, "bamya").some((f) => f.name === "Okra stew with meat"));
  assert.ok(searchFoods(ALL_FOODS, "whey").some((f) => f.name === "Whey protein"));
});

test("a custom food needs a name, a serving and sensible numbers", () => {
  const good = { name: "Protein pancakes", portion: "2 pieces · 120 g", kcal: 320, p: 28, c: 30, f: 9 };
  assert.equal(customFoodError(good), "");
  assert.match(customFoodError({ ...good, name: " " }), /name/);
  assert.match(customFoodError({ ...good, portion: "" }), /serving/);
  assert.match(customFoodError({ ...good, kcal: -5 }), /Calories/);
  assert.match(customFoodError({ ...good, p: "lots" }), /Protein/);
  assert.match(customFoodError({ ...good, f: "" }), /Fat/);
});

async function save(f, account, edit) {
  const seen = await f.call("/api/workspace", { account });
  const next = structuredClone(seen.data);
  edit(next);
  return f.call("/api/workspace", { method: "PATCH", account, body: { revision: seen.revision, changes: workspaceChanges(seen.data, next) } });
}

test("a coach's custom foods are saved and checked; clients can find them but not change them", async () => {
  const f = await fixture({ plannedFirstClient: false });
  try {
    const food = { id: "pancakes", name: "Protein pancakes", portion: "2 pieces · 120 g", kcal: 320, p: 28, c: 30, f: 9 };
    const saved = await save(f, f.coach, (d) => d.customFoods.push(food));
    assert.equal(saved.status, 200, saved.error);
    assert.deepEqual((await f.call("/api/workspace", { account: f.coach })).data.customFoods, [food]);
    const bad = await save(f, f.coach, (d) => d.customFoods.push({ ...food, id: "bad", kcal: "lots" }));
    assert.equal(bad.status, 400, "invalid numbers are refused");

    const { code } = await f.call("/api/coach-code", { account: f.coach });
    const client = await f.call("/api/signup/client", { method: "POST", body: { name: "Maya Chen", email: "maya@test.app", password: "client-password-123", code } });
    assert.equal(client.status, 200);
    assert.deepEqual((await f.call("/api/workspace", { account: client })).data.customFoods, [food], "clients receive the coach's foods to log them");
    const sneaky = await save(f, client, (d) => d.customFoods.push({ ...food, id: "x" }));
    assert.ok([400, 403].includes(sneaky.status), "a client can't add to them");
    assert.equal((await f.call("/api/workspace", { account: f.coach })).data.customFoods.length, 1);
  } finally {
    await f.close();
  }
});
