#!/usr/bin/env node

/**
 * Task Runner Script
 * Reads TASKS.md and generates a prompt for Claude Code agent to implement the next task
 * 
 * Usage: node agents/run-next-task.js
 */

const fs = require('fs');
const path = require('path');

// Read TASKS.md
const tasksPath = path.join(__dirname, '..', 'docs', 'TASKS.md');
const tasksContent = fs.readFileSync(tasksPath, 'utf-8');

// Parse tasks to find next incomplete one
const taskLines = tasksContent.split('\n');
let nextTask = null;
let taskContext = [];
let inTaskSection = false;

for (let i = 0; i < taskLines.length; i++) {
  const line = taskLines[i];
  
  // Check for task markers
  if (line.includes('**Status:**') && (line.includes('❌') || line.includes('Not Started'))) {
    // Found an incomplete task, get context
    let taskName = '';
    let taskPhase = '';
    
    // Look backwards for task name
    for (let j = i - 1; j >= 0; j--) {
      if (taskLines[j].startsWith('###')) {
        taskName = taskLines[j].replace(/###\s*/, '').trim();
        break;
      }
    }
    
    // Look backwards for phase
    for (let j = i - 1; j >= 0; j--) {
      if (taskLines[j].startsWith('##') && !taskLines[j].startsWith('###')) {
        taskPhase = taskLines[j].replace(/##\s*/, '').trim();
        break;
      }
    }
    
    // Get task details
    const taskDetails = [];
    for (let j = i; j < taskLines.length && j < i + 20; j++) {
      if (taskLines[j].startsWith('##')) break;
      taskDetails.push(taskLines[j]);
    }
    
    nextTask = {
      name: taskName,
      phase: taskPhase,
      line: i + 1,
      details: taskDetails.join('\n')
    };
    break;
  }
}

if (!nextTask) {
  console.log('🎉 All tasks are complete! No pending tasks found in TASKS.md');
  process.exit(0);
}

// Generate agent prompt
const prompt = `
You are the panes-developer agent described in agents/panes-developer.md.

## Your Mission

Implement the following task from docs/TASKS.md:

**Phase**: ${nextTask.phase}
**Task**: ${nextTask.name}
**Location**: Line ${nextTask.line} in TASKS.md

## Instructions

1. **Read Required Documents**:
   - docs/UI-SPEC.md - for requirements
   - docs/TASKS.md - for task details
   - agents/panes-developer.md - for implementation guidelines

2. **Follow TDD Approach**:
   - Write comprehensive tests FIRST
   - Implement code to make tests pass
   - Refactor for clarity and performance
   - Ensure accessibility requirements are met

3. **Update Progress**:
   - Update TASKS.md status to 🏗️ when starting
   - Update to ✅ when complete
   - Add notes about implementation decisions

4. **Quality Checks**:
   - Run: npm test
   - Run: npx tsc --noEmit
   - Run: npm run lint
   - Verify keyboard navigation works
   - Check ARIA attributes are present

5. **Commit Your Work**:
   - Stage all changes
   - Create descriptive commit message
   - Do NOT include AI attributions

## Current Project State

- Branch: feature/add-panes
- Completed: Shell scaffolding, Shared components
- Technologies: React 19, TypeScript, Electron 38, Vitest
- Testing: @testing-library/react, Playwright

## Task Details

${nextTask.details}

Begin by analyzing the task requirements and writing the test files.
`;

// Output the prompt
console.log('=' .repeat(80));
console.log('AGENT INVOCATION PROMPT');
console.log('=' .repeat(80));
console.log(prompt);
console.log('=' .repeat(80));
console.log('\n📋 Copy the above prompt and use it to invoke the Task agent in Claude Code');
console.log(`📍 Next task found: ${nextTask.name}`);
console.log(`📦 Phase: ${nextTask.phase}`);

// Optionally save to file for easy access
const promptFile = path.join(__dirname, 'next-task-prompt.txt');
fs.writeFileSync(promptFile, prompt, 'utf-8');
console.log(`\n💾 Prompt saved to: ${promptFile}`);