# Cursor Rules for APH Examples Project

This directory contains Cursor rules that provide persistent guidance to AI agents working on this project.

## Rules Overview

### 1. `read-prd.mdc` (Always Active)
**Instructs agents to always read PRD.md before starting any work.**

This is the most important rule - it ensures agents understand the complete project architecture before making changes.

### 2. `ecs-components.mdc`
**Guidelines for creating and working with ECS components.**

Active when working with:
- Any files containing "component" in the name
- Files in `libs/pixi-ecs/components/`
- Files in `src/**/components/`

Covers:
- Component structure and lifecycle
- Communication via messages
- Fixed timestep usage
- Best practices

### 3. `game-architecture.mdc`
**Architecture patterns for games in this project.**

Active when working with:
- Files in `src/game_*/**/*.ts`

Covers:
- Directory structure
- Factory pattern
- Observable state pattern
- Message naming conventions

### 4. `ecs-builder.mdc`
**Guidelines for using the ECS Builder pattern.**

Active when working with:
- `factory.ts` files
- `builders.ts` files

Covers:
- Creating entities with Builder
- Builder method categories
- Factory functions
- Global components

### 5. `pixel-art-settings.mdc`
**PixiJS settings for pixel art games.**

Active when working with:
- Files in `src/game_*/**/*.ts`
- `index.ts` files

Covers:
- Required PIXI settings for pixel art
- Why these settings matter
- Common resolutions

### 6. `naming-conventions.mdc` (Always Active)
**Naming conventions for this project.**

Covers:
- File naming
- Class and interface naming
- Message naming
- Tag, attribute, flag naming
- Variable naming

### 7. `message-system.mdc`
**Guidelines for using the ECS message system.**

Active when working with:
- TypeScript files

Covers:
- Message-driven architecture
- Sending and receiving messages
- Message payloads
- Best practices

## How Rules Work

- **Always Active Rules** (`alwaysApply: true`) are included in every conversation
- **File-Specific Rules** are activated when matching files are open or being edited
- Rules use glob patterns to determine when they apply

## Adding New Rules

To add a new rule:

1. Create a `.mdc` file in this directory
2. Add YAML frontmatter with `description` and either `alwaysApply` or `globs`
3. Write concise, actionable guidance
4. Include concrete examples

Example:

```markdown
---
description: Brief description
globs: **/*.ts
alwaysApply: false
---

# Rule Title

Your rule content...
```

## Rule Guidelines

- Keep rules under 50 lines when possible
- One concern per rule
- Include concrete examples
- Be actionable and specific
- Reference PRD.md for detailed documentation
