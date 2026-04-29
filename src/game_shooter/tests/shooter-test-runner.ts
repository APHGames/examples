/**
 * Browser-displayable test runner for the shooter game.
 * Executes all tests synchronously and renders pass/fail results as an HTML table.
 * No ECS or PIXI needed — pure TypeScript model tests only.
 */
import { runAllShooterTests, TestResult } from './shooter.test';

function renderResults(results: TestResult[]): void {
	const passed = results.filter(r => r.pass).length;
	const failed = results.filter(r => !r.pass).length;

	const styles = `
    body {
      background: #080f18;
      color: #ccddee;
      font-family: 'Courier New', monospace;
      padding: 24px;
    }
    h1 { color: #66aaff; font-size: 20px; margin-bottom: 4px; }
    .summary { margin-bottom: 16px; font-size: 14px; }
    .summary .pass { color: #44ff88; }
    .summary .fail { color: #ff4455; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #0d1a2a; color: #889aaa; padding: 8px 12px; text-align: left; border-bottom: 1px solid #223344; }
    td { padding: 8px 12px; border-bottom: 1px solid #111c28; vertical-align: top; }
    tr:hover td { background: #0d1a2a; }
    .badge-pass { color: #44ff88; font-weight: bold; }
    .badge-fail { color: #ff4455; font-weight: bold; }
    .error-msg { color: #ff6677; font-size: 12px; margin-top: 4px; word-break: break-all; }
  `;

	const styleEl = document.createElement('style');
	styleEl.textContent = styles;
	document.head.appendChild(styleEl);

	document.body.innerHTML = '';

	const heading = document.createElement('h1');
	heading.textContent = 'Neon Twin-Stick Shooter — Test Results';
	document.body.appendChild(heading);

	const summary = document.createElement('div');
	summary.className = 'summary';
	summary.innerHTML =
		`<span class="pass">✓ ${passed} passed</span>  ` +
		`<span class="fail">${failed > 0 ? '✗ ' + failed + ' failed' : ''}</span>  ` +
		`(${results.length} total)`;
	document.body.appendChild(summary);

	const table = document.createElement('table');
	const headerRow = document.createElement('tr');
	headerRow.innerHTML = '<th>#</th><th>Test Name</th><th>Result</th>';
	table.appendChild(headerRow);

	results.forEach((result, i) => {
		const row = document.createElement('tr');

		const numCell = document.createElement('td');
		numCell.textContent = String(i + 1);
		row.appendChild(numCell);

		const nameCell = document.createElement('td');
		nameCell.textContent = result.name;
		row.appendChild(nameCell);

		const resultCell = document.createElement('td');
		if (result.pass) {
			resultCell.innerHTML = '<span class="badge-pass">PASS</span>';
		} else {
			resultCell.innerHTML = `<span class="badge-fail">FAIL</span>` +
				(result.error ? `<div class="error-msg">${escapeHtml(result.error)}</div>` : '');
		}
		row.appendChild(resultCell);

		table.appendChild(row);
	});

	document.body.appendChild(table);
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

// Run immediately when this module is executed in a browser context
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
	const results = runAllShooterTests();
	renderResults(results);
	// Also log to console for CI / headless environments
	for (const r of results) {
		if (r.pass) {
			console.log(`✓ ${r.name}`);
		} else {
			console.error(`✗ ${r.name}: ${r.error}`);
		}
	}
}

export { runAllShooterTests };
