#!/usr/bin/env node

/**
 * Development Log Updater
 * Automatically updates DEVELOPMENT_LOG.md when tasks are completed
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DevLogUpdater {
  constructor() {
    this.logPath = path.join(process.cwd(), 'DEVELOPMENT_LOG.md');
    this.tasksPath = path.join(process.cwd(), '.kiro/specs/funny-notes-platform/tasks.md');
  }

  /**
   * Add a new task completion entry to the development log
   */
  addTaskCompletion(taskInfo) {
    const {
      taskNumber,
      taskName,
      status,
      changes = [],
      issues = [],
      technicalDebt = [],
      files = []
    } = taskInfo;

    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const entry = this.formatTaskEntry({
      taskNumber,
      taskName,
      date,
      status,
      changes,
      issues,
      technicalDebt,
      files
    });

    this.insertTaskEntry(entry);
    this.updateLastModified();
  }

  /**
   * Format a task completion entry
   */
  formatTaskEntry({ taskNumber, taskName, date, status, changes, issues, technicalDebt, files }) {
    let entry = `### ✅ Task ${taskNumber}: ${taskName}\n`;
    entry += `**Completed:** ${date}  \n`;
    entry += `**Status:** ${status.toUpperCase()}\n\n`;

    if (changes.length > 0) {
      entry += `#### Changes Made:\n`;
      changes.forEach((change, index) => {
        entry += `${index + 1}. ${change}\n`;
      });
      entry += '\n';
    }

    if (files.length > 0) {
      entry += `#### Files Modified:\n`;
      files.forEach(file => {
        entry += `- \`${file}\`\n`;
      });
      entry += '\n';
    }

    if (issues.length > 0) {
      entry += `#### Issues Resolved:\n`;
      issues.forEach(issue => {
        entry += `- ✅ ${issue}\n`;
      });
      entry += '\n';
    }

    if (technicalDebt.length > 0) {
      entry += `#### Technical Debt:\n`;
      technicalDebt.forEach(debt => {
        entry += `- ⚠️ ${debt}\n`;
      });
      entry += '\n';
    }

    entry += '---\n\n';
    return entry;
  }

  /**
   * Insert a new task entry at the top of the task completion log
   */
  insertTaskEntry(entry) {
    if (!fs.existsSync(this.logPath)) {
      console.error('Development log not found at:', this.logPath);
      return;
    }

    const content = fs.readFileSync(this.logPath, 'utf8');
    const insertPoint = content.indexOf('## Task Completion Log\n\n') + '## Task Completion Log\n\n'.length;
    
    const newContent = 
      content.slice(0, insertPoint) + 
      entry + 
      content.slice(insertPoint);

    fs.writeFileSync(this.logPath, newContent);
    console.log(`✅ Added task completion entry to development log`);
  }

  /**
   * Update the "Last Updated" timestamp
   */
  updateLastModified() {
    const content = fs.readFileSync(this.logPath, 'utf8');
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const updatedContent = content.replace(
      /\*Last Updated:.*\*/,
      `*Last Updated: ${date}*`
    );

    fs.writeFileSync(this.logPath, updatedContent);
  }

  /**
   * Parse tasks.md to get current task status
   */
  getCurrentTaskStatus() {
    if (!fs.existsSync(this.tasksPath)) {
      console.error('Tasks file not found at:', this.tasksPath);
      return [];
    }

    const content = fs.readFileSync(this.tasksPath, 'utf8');
    const lines = content.split('\n');
    const tasks = [];

    lines.forEach(line => {
      const taskMatch = line.match(/^- \[(x| )\] (\d+(?:\.\d+)?)\. (.+)/);
      if (taskMatch) {
        const [, status, number, name] = taskMatch;
        tasks.push({
          number,
          name,
          completed: status === 'x',
          line
        });
      }
    });

    return tasks;
  }

  /**
   * Quick method to log a completed task
   */
  static logTaskCompletion(taskNumber, taskName, details = {}) {
    const updater = new DevLogUpdater();
    updater.addTaskCompletion({
      taskNumber,
      taskName,
      status: 'completed',
      ...details
    });
  }
}

// Export for use in other scripts
export default DevLogUpdater;

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node update-dev-log.js <task-number> <task-name> [changes...]');
    console.log('Example: node update-dev-log.js 8 "Fix Note Model" "Updated Note.ts" "Fixed components"');
    process.exit(1);
  }

  const [taskNumber, taskName, ...changes] = args;
  
  DevLogUpdater.logTaskCompletion(taskNumber, taskName, {
    changes: changes.length > 0 ? changes : ['Task completed successfully']
  });
}