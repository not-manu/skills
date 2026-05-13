---
name: update-todos
description: Update the project's TODO.md by checking off completed tasks and moving them under the **done** section. Use this skill whenever the user asks to update todos, mark a task done, move completed items to done, tick off a todo, or clean up TODO.md after finishing work — even when they don't explicitly mention the file. Also trigger on phrases like "/update-todos", "log that as done", "move this to done", or "todo bookkeeping".
---

# update-todos

Keep `TODO.md` tidy after work is finished. Minimal, mechanical.

## What to do

1. Read `TODO.md` at the repo root (or the path the user names).
2. Identify which open `- [ ]` items the recent conversation actually completed. If it's ambiguous, ask the user which ones to move — don't guess.
3. For each completed item:
   - Remove it from its current location in the open list.
   - Append it to the `**done**` section as `- [x] <text>`.
   - If the fix had a non-obvious root cause or resolution worth remembering, add a short trailing note on the same item (1-3 lines, indented). Skip the note when the title already says everything.
4. Preserve the rest of the file verbatim — section headers, blank lines, ordering of untouched items, indentation style.

## Notes

- The `**done**` section is the archive. New entries go at the bottom of it.
- Don't invent tasks, don't reword open items, don't reorder unrelated lines.
- If there's no `**done**` section yet, create one just below the open list.
- If nothing in the conversation maps to an open todo, say so instead of forcing a move.
