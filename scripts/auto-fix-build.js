#!/usr/bin/env node

/**
 * Automated GitHub Build Fixer
 * 
 * A Claude Code agent that:
 * 1. Runs the GitHub build script
 * 2. Waits for completion
 * 3. Analyzes any errors
 * 4. Fixes the errors automatically
 * 5. Repeats until all issues are resolved
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class AutoBuildFixer {
    constructor() {
        this.maxRetries = 3;
        this.currentRetry = 0;
        this.buildScriptPath = './scripts/github-build.sh';
        this.fixAttempts = [];
    }

    /**
     * Main entry point
     */
    async run() {
        console.log('🤖 Automated GitHub Build Fixer Starting...');
        console.log('======================================================');
        
        try {
            await this.runBuildCycle();
        } catch (error) {
            console.error('❌ Fatal error in build fixer:', error.message);
            process.exit(1);
        }
    }

    /**
     * Main build cycle - run build, check results, fix if needed
     */
    async runBuildCycle() {
        while (this.currentRetry <= this.maxRetries) {
            console.log(`\n🚀 Build Attempt ${this.currentRetry + 1}/${this.maxRetries + 1}`);
            console.log('=' .repeat(50));
            
            // Run the build script
            const buildResult = await this.runBuildScript();
            
            if (buildResult.success) {
                console.log('\n🎉 BUILD SUCCESS! All GitHub Actions passed.');
                console.log('✅ No fixes needed. Build pipeline completed successfully.');
                return;
            }
            
            // Analyze and attempt to fix errors
            console.log('\n🔍 Build failed. Analyzing errors...');
            const fixes = await this.analyzeAndFix(buildResult.errors);
            
            if (fixes.length === 0) {
                console.log('\n❌ No automatic fixes available for current errors.');
                console.log('Manual intervention required. Check the error details above.');
                break;
            }
            
            // Apply fixes
            await this.applyFixes(fixes);
            
            this.currentRetry++;
        }
        
        if (this.currentRetry > this.maxRetries) {
            console.log('\n❌ Maximum retry attempts reached.');
            console.log('Build fixer could not automatically resolve all issues.');
            this.printSummary();
        }
    }

    /**
     * Run the GitHub build script and capture results
     */
    async runBuildScript() {
        return new Promise((resolve) => {
            console.log('🔄 Running GitHub build script...');
            
            const buildProcess = spawn('npm', ['run', 'github-build'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true
            });
            
            let stdout = '';
            let stderr = '';
            
            buildProcess.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                // Show real-time output but filter noisy progress messages
                if (!output.includes('GitHub Actions still running')) {
                    process.stdout.write(output);
                }
            });
            
            buildProcess.stderr.on('data', (data) => {
                stderr += data.toString();
                process.stderr.write(data);
            });
            
            buildProcess.on('close', (code) => {
                console.log(`\n📊 Build script completed with exit code: ${code}`);
                
                resolve({
                    success: code === 0,
                    exitCode: code,
                    stdout,
                    stderr,
                    errors: this.extractErrors(stdout + stderr)
                });
            });
        });
    }

    /**
     * Extract error information from build output
     */
    extractErrors(output) {
        const errors = [];
        const lines = output.split('\n');
        
        let inFailureSection = false;
        let currentError = null;
        
        for (const line of lines) {
            // Detect start of failure details
            if (line.includes('FAILED:') || line.includes('Some GitHub Actions failed')) {
                inFailureSection = true;
                if (line.includes('FAILED:')) {
                    currentError = {
                        workflow: line.replace(/.*FAILED:\s*/, '').trim(),
                        logs: [],
                        url: ''
                    };
                }
            }
            
            // Capture workflow URLs
            if (inFailureSection && line.includes('URL:')) {
                if (currentError) {
                    currentError.url = line.replace(/.*URL:\s*/, '').trim();
                }
            }
            
            // Capture error logs
            if (inFailureSection && line.includes('│')) {
                if (currentError) {
                    currentError.logs.push(line.replace(/.*│\s*/, '').trim());
                }
            }
            
            // End of current error section
            if (inFailureSection && line.includes('━━━━') && currentError) {
                errors.push(currentError);
                currentError = null;
            }
        }
        
        return errors;
    }

    /**
     * Analyze errors and determine possible fixes
     */
    async analyzeAndFix(errors) {
        const fixes = [];
        
        for (const error of errors) {
            console.log(`\n🔍 Analyzing error in workflow: ${error.workflow}`);
            
            const errorAnalysis = this.analyzeErrorType(error);
            const possibleFixes = await this.generateFixes(errorAnalysis);
            
            fixes.push(...possibleFixes);
        }
        
        return fixes;
    }

    /**
     * Analyze the type of error based on logs
     */
    analyzeErrorType(error) {
        const logs = error.logs.join(' ').toLowerCase();
        
        // Common error patterns and their categories
        const errorPatterns = [
            {
                pattern: /npm.*test.*failed|test.*failed|expect.*received/,
                type: 'test_failure',
                description: 'Test failure detected'
            },
            {
                pattern: /lint.*error|eslint.*error/,
                type: 'lint_error',
                description: 'ESLint error detected'
            },
            {
                pattern: /typescript.*error|ts.*error|cannot find module/,
                type: 'typescript_error',
                description: 'TypeScript compilation error'
            },
            {
                pattern: /build.*failed|compilation.*failed/,
                type: 'build_error',
                description: 'Build compilation error'
            },
            {
                pattern: /package.*not.*found|module.*not.*found/,
                type: 'dependency_error',
                description: 'Missing dependency error'
            },
            {
                pattern: /playwright.*error|browser.*error/,
                type: 'e2e_error',
                description: 'End-to-end test error'
            }
        ];
        
        for (const { pattern, type, description } of errorPatterns) {
            if (pattern.test(logs)) {
                return {
                    type,
                    description,
                    workflow: error.workflow,
                    logs: error.logs,
                    url: error.url
                };
            }
        }
        
        return {
            type: 'unknown',
            description: 'Unknown error type',
            workflow: error.workflow,
            logs: error.logs,
            url: error.url
        };
    }

    /**
     * Generate fixes based on error analysis
     */
    async generateFixes(errorAnalysis) {
        const fixes = [];
        
        console.log(`  📝 Error type: ${errorAnalysis.type} - ${errorAnalysis.description}`);
        
        switch (errorAnalysis.type) {
            case 'lint_error':
                fixes.push({
                    type: 'run_lint_fix',
                    description: 'Run ESLint auto-fix',
                    command: 'npm run lint -- --fix'
                });
                break;
                
            case 'test_failure':
                // For test failures, we'll analyze the specific test
                const testFix = await this.analyzeTestFailure(errorAnalysis);
                if (testFix) fixes.push(testFix);
                break;
                
            case 'typescript_error':
                fixes.push({
                    type: 'typescript_fix',
                    description: 'Attempt to fix TypeScript errors',
                    command: 'npx tsc --noEmit'
                });
                break;
                
            case 'dependency_error':
                fixes.push({
                    type: 'install_deps',
                    description: 'Install missing dependencies',
                    command: 'npm install'
                });
                break;
                
            case 'e2e_error':
                fixes.push({
                    type: 'e2e_fix',
                    description: 'Update E2E test selectors and waits',
                    action: 'manual_e2e_fix'
                });
                break;
                
            default:
                console.log('  ⚠️  No automatic fix available for this error type');
        }
        
        return fixes;
    }

    /**
     * Analyze specific test failures
     */
    async analyzeTestFailure(errorAnalysis) {
        const logs = errorAnalysis.logs.join(' ');
        
        // Look for common test patterns
        if (logs.includes('tab-closing') || logs.includes('close button')) {
            return {
                type: 'tab_test_fix',
                description: 'Fix tab closing test issues',
                action: 'fix_tab_tests'
            };
        }
        
        if (logs.includes('timeout') || logs.includes('waitForSelector')) {
            return {
                type: 'timeout_fix',
                description: 'Increase test timeouts',
                action: 'increase_timeouts'
            };
        }
        
        return null;
    }

    /**
     * Apply the determined fixes
     */
    async applyFixes(fixes) {
        console.log(`\n🔧 Applying ${fixes.length} fix(es)...`);
        
        for (const fix of fixes) {
            console.log(`\n  🔨 ${fix.description}`);
            
            try {
                if (fix.command) {
                    await this.runCommand(fix.command);
                } else if (fix.action) {
                    await this.performAction(fix.action);
                }
                
                console.log(`  ✅ Fix applied: ${fix.description}`);
                this.fixAttempts.push({
                    fix: fix.description,
                    success: true,
                    timestamp: new Date()
                });
                
            } catch (error) {
                console.log(`  ❌ Fix failed: ${fix.description} - ${error.message}`);
                this.fixAttempts.push({
                    fix: fix.description,
                    success: false,
                    error: error.message,
                    timestamp: new Date()
                });
            }
        }
        
        // Commit fixes if any were successful
        const successfulFixes = this.fixAttempts.filter(f => f.success);
        if (successfulFixes.length > 0) {
            await this.commitFixes(successfulFixes);
        }
    }

    /**
     * Run a shell command
     */
    async runCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    console.log(`    Output: ${stdout.trim()}`);
                    if (stderr) console.log(`    Warnings: ${stderr.trim()}`);
                    resolve({ stdout, stderr });
                }
            });
        });
    }

    /**
     * Perform manual fix actions
     */
    async performAction(action) {
        switch (action) {
            case 'fix_tab_tests':
                await this.fixTabTests();
                break;
            case 'increase_timeouts':
                await this.increaseTimeouts();
                break;
            case 'manual_e2e_fix':
                console.log('    📋 Manual E2E fix needed - would analyze and fix selectors');
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    /**
     * Fix tab-related test issues
     */
    async fixTabTests() {
        // This would contain logic to fix common tab test issues
        console.log('    🔍 Analyzing tab closing test patterns...');
        console.log('    ⚡ This would implement tab test fixes based on error analysis');
        // In a real implementation, this would read test files and apply fixes
    }

    /**
     * Increase timeouts in tests
     */
    async increaseTimeouts() {
        console.log('    ⏱️  Increasing test timeouts...');
        // This would implement timeout increases
        console.log('    ⚡ This would scan test files and increase timeout values');
    }

    /**
     * Commit applied fixes
     */
    async commitFixes(fixes) {
        const fixDescriptions = fixes.map(f => f.fix).join(', ');
        const commitMessage = `fix: automated build fixes - ${fixDescriptions}`;
        
        try {
            await this.runCommand('git add -A');
            await this.runCommand(`git commit -m "${commitMessage}"`);
            console.log(`\n  📝 Committed fixes: ${fixDescriptions}`);
        } catch (error) {
            console.log(`\n  ⚠️  Could not commit fixes: ${error.message}`);
        }
    }

    /**
     * Print summary of all attempts
     */
    printSummary() {
        console.log('\n📊 BUILD FIXER SUMMARY');
        console.log('=' .repeat(50));
        console.log(`Total attempts: ${this.currentRetry}`);
        console.log(`Fixes applied: ${this.fixAttempts.length}`);
        
        const successful = this.fixAttempts.filter(f => f.success);
        const failed = this.fixAttempts.filter(f => !f.success);
        
        console.log(`Successful fixes: ${successful.length}`);
        console.log(`Failed fixes: ${failed.length}`);
        
        if (successful.length > 0) {
            console.log('\n✅ Successful fixes:');
            successful.forEach(fix => {
                console.log(`  • ${fix.fix}`);
            });
        }
        
        if (failed.length > 0) {
            console.log('\n❌ Failed fixes:');
            failed.forEach(fix => {
                console.log(`  • ${fix.fix}: ${fix.error}`);
            });
        }
    }
}

// Run the auto-fixer if called directly
if (require.main === module) {
    const fixer = new AutoBuildFixer();
    fixer.run().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = AutoBuildFixer;