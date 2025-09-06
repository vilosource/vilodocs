# Task Automation Agents

This directory contains automation tools and agent specifications for implementing the panes feature in vilodocs.

## 🤖 Agent System

### Purpose
Automate the implementation of tasks from `docs/TASKS.md` using Claude Code's Task agent with specialized knowledge of the project.

### Files

#### `panes-developer.md`
Expert agent specification that understands:
- Project technologies (React, Electron, TypeScript, Vitest)
- VS Code-style layout requirements
- TDD methodology
- Project structure and patterns

#### `task-automation.md`
Strategy guide for using the agent effectively, including:
- Invocation templates
- Task prioritization
- Progress monitoring
- Quality gates

## 🛠️ Automation Scripts

### `check-task-status.js`
Displays current progress of all tasks.

```bash
node agents/check-task-status.js
```

Shows:
- Phase-by-phase progress
- Task completion status
- Overall progress percentage
- Next suggested task

### `run-next-task.js`
Generates an agent prompt for the next incomplete task.

```bash
node agents/run-next-task.js
```

Output:
- Ready-to-use agent invocation prompt
- Task context and requirements
- Saves prompt to `next-task-prompt.txt`

## 📋 Workflow

### 1. Check Current Status
```bash
node agents/check-task-status.js
```

### 2. Generate Agent Prompt
```bash
node agents/run-next-task.js
```

### 3. Invoke Agent in Claude Code
Use the Task tool with the generated prompt:
```
Task: "Implement next panes task"
Prompt: [paste from next-task-prompt.txt]
Subagent Type: general-purpose
```

### 4. Monitor Progress
The agent will:
- Read task requirements
- Write tests first (TDD)
- Implement solution
- Update TASKS.md
- Commit changes

### 5. Verify Completion
```bash
# Run tests
npm test

# Check TypeScript
npx tsc --noEmit

# Check lint
npm run lint

# Verify task status
node agents/check-task-status.js
```

## 🎯 Task Execution Strategy

### Small Batches (Recommended)
- Execute 1-3 related tasks per session
- Commit after each task
- Review between batches

### Phase Completion
- Complete all tasks in a phase
- Integration test at phase end
- Move to next phase

### Quality First
- Always follow TDD
- Ensure accessibility
- Test keyboard navigation
- No TypeScript errors

## 🚀 Quick Start

1. **Check what needs to be done:**
   ```bash
   node agents/check-task-status.js
   ```

2. **Get agent prompt for next task:**
   ```bash
   node agents/run-next-task.js
   ```

3. **Copy prompt and invoke agent:**
   - Open Claude Code
   - Use Task tool
   - Paste the generated prompt
   - Let agent work autonomously

4. **Verify work:**
   ```bash
   npm test
   git status
   ```

## 📊 Current Progress

As of last update:
- ✅ Phase 1: Foundation & Shell Scaffolding (Complete)
- ✅ Phase 2: Shared Components (Complete)
- ⏳ Phase 3: Editor Grid Core (Next)
- ⏳ Phase 4-10: Pending

## 🔧 Troubleshooting

### Agent Gets Stuck
- Stop execution
- Check error messages
- Fix blockers manually
- Restart with updated context

### Tests Failing
- Run specific test: `npm test -- path/to/test`
- Check test assumptions
- Verify against UI-SPEC.md

### Build Issues
- Clear node_modules: `rm -rf node_modules && npm install`
- Check TypeScript: `npx tsc --noEmit`
- Fix lint: `npm run lint -- --fix`

## 📝 Notes

- Agent follows TDD strictly - tests before implementation
- Commits automatically (no AI attribution)
- Updates TASKS.md progress
- Follows VS Code design patterns
- Ensures accessibility compliance