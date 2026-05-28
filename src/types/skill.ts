export type CountableItem =
    | 'apple'
    | 'fish'
    | 'leaf'
    | 'flower'
    | 'star'
    | 'acorn'
    | 'butterfly'
    | 'cloud';

export type BuildingType =
    | 'tent'
    | 'shop'
    | 'museum'
    | 'bridge'
    | 'lighthouse'
    | 'campfire'
    | 'farm'
    | 'workshop'
    | 'observatory'
    | 'cafe'
    | 'library'
    | 'fountain';

export type QuestionType =
    | 'multiple-choice'
    | 'tap-to-count'
    | 'drag-to-match'
    | 'number-line';

export interface CountableVisual {
    kind: 'countable';
    item: CountableItem;
    count: number;
}

export interface ExpressionVisual {
    kind: 'expression';
    left: number;
    operator: '+' | '-' | '>' | '<' | '=' | '?';
    right: number;
}

export type Visual = CountableVisual | ExpressionVisual;

export interface MultipleChoiceQuestion {
    type: 'multiple-choice';
    prompt: string;
    visual?: Visual;
    options: number[];
    answer: number;
}

export interface TapToCountQuestion {
    type: 'tap-to-count';
    prompt: string;
    item: CountableItem;
    count: number;
}

export interface DragToMatchQuestion {
    type: 'drag-to-match';
    prompt: string;
    numbers: number[];
    targets: Array<{ count: number; item: CountableItem }>;
    pairs: Array<[number, number]>;
}

export interface NumberLineQuestion {
    type: 'number-line';
    prompt: string;
    min: number;
    max: number;
    step: number;
    answer: number;
}

export type Question =
    | MultipleChoiceQuestion
    | TapToCountQuestion
    | DragToMatchQuestion
    | NumberLineQuestion;

export interface SkillMeta {
    id: string;
    name: string;
    description: string;
    ccStandard: string;
    prereq: string[];
    building: BuildingType;
    position: { x: number; y: number };
    order: number;
}

export interface SkillContent {
    id: string;
    questions: Question[];
}
