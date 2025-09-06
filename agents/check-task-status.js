#!/usr/bin/env node

/**
 * Task Status Checker
 * Displays current status of all tasks in TASKS.md
 * 
 * Usage: node agents/check-task-status.js
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

// Read TASKS.md
const tasksPath = path.join(__dirname, '..', 'docs', 'TASKS.md');
const tasksContent = fs.readFileSync(tasksPath, 'utf-8');

// Parse tasks
const taskLines = tasksContent.split('\n');
const phases = [];
let currentPhase = null;
let currentTask = null;

for (const line of taskLines) {
  // Phase detection
  if (line.startsWith('## Phase') && !line.includes('##.#')) {
    if (currentPhase) {
      phases.push(currentPhase);
    }
    currentPhase = {
      name: line.replace(/##\s*/, '').trim(),
      tasks: [],
      completed: 0,
      total: 0
    };
  }
  
  // Task detection
  if (line.startsWith('### ') && currentPhase) {
    currentTask = {
      name: line.replace(/###\s*/, '').trim(),
      status: 'unknown'
    };
    currentPhase.tasks.push(currentTask);
    currentPhase.total++;
  }
  
  // Status detection
  if (line.includes('**Status:**') && currentTask) {
    if (line.includes('✅') || line.includes('Complete')) {
      currentTask.status = 'complete';
      currentPhase.completed++;
    } else if (line.includes('🏗️') || line.includes('In Progress')) {
      currentTask.status = 'in-progress';
    } else if (line.includes('❌') || line.includes('Not Started')) {
      currentTask.status = 'not-started';
    }
  }
}

// Add last phase
if (currentPhase) {
  phases.push(currentPhase);
}

// Display summary
console.log('\n' + '='.repeat(80));
console.log(colors.bold + 'VILODOCS PANES FEATURE - TASK STATUS' + colors.reset);
console.log('='.repeat(80));

let totalTasks = 0;
let completedTasks = 0;
let inProgressTasks = 0;
let notStartedTasks = 0;

// Display each phase
phases.forEach((phase, phaseIndex) => {
  const progress = phase.total > 0 ? Math.round((phase.completed / phase.total) * 100) : 0;
  const progressBar = generateProgressBar(progress);
  
  console.log(`\n${colors.bold}${colors.blue}${phase.name}${colors.reset}`);
  console.log(`${progressBar} ${progress}% (${phase.completed}/${phase.total} tasks)`);
  
  phase.tasks.forEach((task, taskIndex) => {
    let statusIcon = '';
    let statusColor = '';
    
    switch (task.status) {
      case 'complete':
        statusIcon = '✅';
        statusColor = colors.green;
        completedTasks++;
        break;
      case 'in-progress':
        statusIcon = '🏗️';
        statusColor = colors.yellow;
        inProgressTasks++;
        break;
      case 'not-started':
        statusIcon = '❌';
        statusColor = colors.red;
        notStartedTasks++;
        break;
      default:
        statusIcon = '❓';
        statusColor = colors.dim;
    }
    
    totalTasks++;
    console.log(`  ${statusIcon} ${statusColor}${task.name}${colors.reset}`);
  });
});

// Overall summary
console.log('\n' + '='.repeat(80));
console.log(colors.bold + 'OVERALL PROGRESS' + colors.reset);
console.log('='.repeat(80));

const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
const overallProgressBar = generateProgressBar(overallProgress);

console.log(`\n${overallProgressBar} ${overallProgress}% Complete`);
console.log(`\n📊 Task Breakdown:`);
console.log(`  ${colors.green}✅ Completed: ${completedTasks}${colors.reset}`);
console.log(`  ${colors.yellow}🏗️  In Progress: ${inProgressTasks}${colors.reset}`);
console.log(`  ${colors.red}❌ Not Started: ${notStartedTasks}${colors.reset}`);
console.log(`  📋 Total Tasks: ${totalTasks}`);

// Next task suggestion
const nextTask = phases
  .flatMap(p => p.tasks)
  .find(t => t.status === 'not-started');

if (nextTask) {
  console.log(`\n${colors.bold}🎯 Next Suggested Task:${colors.reset}`);
  console.log(`  ${nextTask.name}`);
  console.log(`\n💡 Run: ${colors.dim}node agents/run-next-task.js${colors.reset} to generate agent prompt`);
} else if (inProgressTasks > 0) {
  console.log(`\n${colors.yellow}⚠️  There are ${inProgressTasks} tasks in progress${colors.reset}`);
} else {
  console.log(`\n${colors.green}🎉 All tasks completed!${colors.reset}`);
}

console.log();

// Helper function to generate progress bar
function generateProgressBar(percentage) {
  const width = 30;
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  
  let bar = '[';
  bar += colors.green + '█'.repeat(filled) + colors.reset;
  bar += colors.dim + '░'.repeat(empty) + colors.reset;
  bar += ']';
  
  return bar;
}