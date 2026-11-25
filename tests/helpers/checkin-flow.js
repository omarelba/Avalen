// The client check-in asks one question at a time. These helpers walk through it the way
// a person does: answer the question on screen, then Continue (or Skip an optional one).

const dialogOf = (page) => page.getByRole('dialog', { name: 'Your check-in', exact: true });
const onScreen = async (locator) => (await locator.count()) > 0 && (await locator.first().isVisible().catch(() => false));

// answers: { 'Weight (kg)': '78.4', 'Progress photos': { files: 'path' }, ... }
// Stops at the last step; sends unless send is false.
export async function answerCheckin(page, answers = {}, { send = true, dismiss = true } = {}) {
  const dialog = dialogOf(page);
  const pending = new Map(Object.entries(answers));
  for (let i = 0; i < 40; i++) {
    for (const [label, value] of pending) {
      const field = dialog.getByLabel(label, { exact: true });
      if (!(await field.count())) continue;
      if (value && typeof value === 'object' && 'files' in value) await field.setInputFiles(value.files);
      else await field.fill(String(value));
      pending.delete(label);
    }
    const sendButton = dialog.getByRole('button', { name: 'Send check-in', exact: true });
    if (await onScreen(sendButton)) {
      if (pending.size) throw new Error(`Check-in never asked: ${[...pending.keys()].join(', ')}`);
      if (send) {
        await sendButton.click();
        if (dismiss) await dismissSent(page);
      }
      return;
    }
    await nextStep(dialog);
  }
  throw new Error('The check-in never reached Send.');
}

// Moves forward until the last step (Send), answering nothing.
export async function toLastStep(page) {
  const dialog = dialogOf(page);
  for (let i = 0; i < 40; i++) {
    if (await onScreen(dialog.getByRole('button', { name: 'Send check-in', exact: true }))) return;
    await nextStep(dialog);
  }
  throw new Error('The check-in never reached Send.');
}

// Steps back until the field with this label is on screen.
export async function backTo(page, label) {
  const dialog = dialogOf(page);
  for (let i = 0; i < 40; i++) {
    if (await onScreen(dialog.getByLabel(label, { exact: true }))) return;
    await dialog.getByRole('button', { name: 'Back', exact: true }).click();
  }
  throw new Error(`Never found ${label}.`);
}

// After sending, a short confirmation appears; tapping Done clears it at once.
export async function dismissSent(page) {
  const done = page.locator('.checkin-sent').getByRole('button', { name: 'Done', exact: true });
  await done.waitFor({ timeout: 5000 }).catch(() => {});
  if (await done.count()) await done.click();
}

async function nextStep(dialog) {
  const next = dialog.getByRole('button', { name: 'Continue', exact: true });
  if (await next.isEnabled()) await next.click();
  else await dialog.getByRole('button', { name: /^(Skip|Next)$/ }).click();
}
