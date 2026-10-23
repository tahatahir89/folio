import type { DocSettings, PMNode } from '../types';
import { doc, h, hr, ol, p, quote, subtitle, table, tasks, title, ul } from './builders';

export type TemplateCategory = 'Business' | 'Education' | 'Personal' | 'Career' | 'Reports';

export const TEMPLATE_CATEGORIES: TemplateCategory[] = ['Business', 'Education', 'Personal', 'Career', 'Reports'];

export interface TemplateDef {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  /** Shown as the document type on cards. */
  typeLabel: string;
  title: string;
  settings?: Partial<DocSettings>;
  content: PMNode;
}

const tight = { lineHeight: 1.25, spaceAfter: 4 };

const blank: TemplateDef = {
  id: 'blank',
  name: 'Blank document',
  description: 'Start with an empty page.',
  category: 'Personal',
  typeLabel: 'Document',
  title: 'Untitled document',
  content: doc(p()),
};

const resume: TemplateDef = {
  id: 'resume',
  name: 'Resume',
  description: 'A one-page resume with experience, education and skills.',
  category: 'Career',
  typeLabel: 'Resume',
  title: 'Resume',
  settings: { margins: 'narrow' },
  content: doc(
    p('**Your Name**', { textAlign: 'center', ...tight }),
    p('Job title  |  City, Country  |  you@example.com  |  +00 000 0000000', { textAlign: 'center', spaceAfter: 6 }),
    h(2, 'Summary'),
    p('Two or three sentences about who you are, what you do best, and the kind of role you are looking for.', { lineHeight: 1.35 }),
    h(2, 'Experience'),
    p('**Job title**, Company name', tight),
    p('*Month Year – Present  |  City*', { ...tight, spaceAfter: 4 }),
    ul(
      'Led a project that improved a measurable result by a specific number.',
      'Built or shipped something that people used, and describe the impact.',
      'Collaborated with teammates across functions to deliver on time.',
    ),
    p('**Previous job title**, Previous company', tight),
    p('*Month Year – Month Year  |  City*', { ...tight, spaceAfter: 4 }),
    ul('Describe an accomplishment using a strong verb and a result.', 'Mention tools, methods or skills you used.'),
    h(2, 'Education'),
    p('**Degree, Field of study**, University name', tight),
    p('*Year – Year*', { spaceAfter: 6 }),
    h(2, 'Skills'),
    ul('Skill one, skill two, skill three', 'Languages: English (fluent), another language (conversational)', 'Tools: list the tools you use daily'),
  ),
};

const proposal: TemplateDef = {
  id: 'business-proposal',
  name: 'Business proposal',
  description: 'Pitch a project with scope, timeline and pricing.',
  category: 'Business',
  typeLabel: 'Proposal',
  title: 'Business proposal',
  content: doc(
    title('Proposal for [Client name]'),
    subtitle('Prepared by [Your company]  ·  [Date]'),
    h(1, 'Executive summary'),
    p('Summarize the problem your client faces, the solution you propose, and the result they can expect. Keep this section to one short paragraph.'),
    h(1, 'The challenge'),
    p('Describe the situation in the client’s own terms. Show that you understand their goals, constraints and what is at stake.'),
    h(1, 'Our approach'),
    ol('**Discover**: interviews and audit of the current state.', '**Design**: a clear plan with measurable milestones.', '**Deliver**: build, test and launch with regular check-ins.'),
    h(1, 'Timeline'),
    table(['Phase', 'Deliverable', 'Duration'], ['Discover', 'Findings report', '2 weeks'], ['Design', 'Plan and prototype', '3 weeks'], ['Deliver', 'Final solution', '6 weeks']),
    h(1, 'Investment'),
    table(['Item', 'Cost'], ['Discovery', '$0,000'], ['Design', '$0,000'], ['Delivery', '$0,000'], ['**Total**', '**$0,000**']),
    h(1, 'Next steps'),
    tasks('Review this proposal', 'Schedule a call to discuss questions', 'Sign and return the agreement'),
    quote('“A short testimonial from a previous client can build trust right here.”'),
  ),
};

const report: TemplateDef = {
  id: 'project-report',
  name: 'Project report',
  description: 'Status, progress, risks and next steps for a project.',
  category: 'Reports',
  typeLabel: 'Report',
  title: 'Project report',
  settings: { pageNumbers: true },
  content: doc(
    title('Project report'),
    subtitle('[Project name]  ·  Reporting period: [start] to [end]'),
    h(1, 'Summary'),
    p('Give readers the headline in two or three sentences: where the project stands, whether it is on track, and what needs a decision.'),
    h(1, 'Progress'),
    table(['Milestone', 'Owner', 'Status', 'Due'], ['Kickoff', 'Name', 'Done', '[date]'], ['First release', 'Name', 'In progress', '[date]'], ['Launch', 'Name', 'Not started', '[date]']),
    h(2, 'Highlights'),
    ul('What went well this period', 'Key results or metrics', 'Recognition for the team'),
    h(1, 'Risks and issues'),
    table(['Risk', 'Impact', 'Mitigation'], ['Describe the risk', 'High / Medium / Low', 'What you are doing about it']),
    h(1, 'Next steps'),
    ol('Decision needed from the sponsor', 'Work planned for the next period', 'Resources or support required'),
    h(1, 'Appendix'),
    p('Attach supporting data, charts or links here.'),
  ),
};

const meeting: TemplateDef = {
  id: 'meeting-notes',
  name: 'Meeting notes',
  description: 'Agenda, discussion, decisions and action items.',
  category: 'Business',
  typeLabel: 'Meeting notes',
  title: 'Meeting notes',
  content: doc(
    title('Meeting notes'),
    p('**Date:** [date]    **Time:** [time]    **Location:** [room or link]', { spaceAfter: 2 }),
    p('**Attendees:** [names]'),
    h(2, 'Agenda'),
    ol('Review of last meeting’s actions', 'Main topic', 'Open questions'),
    h(2, 'Discussion'),
    p('Capture the key points, not a transcript. Note who raised each point when it matters.'),
    ul('Point one', 'Point two'),
    h(2, 'Decisions'),
    ul('We decided to…'),
    h(2, 'Action items'),
    tasks('[Owner] to [do something] by [date]', '[Owner] to [do something] by [date]', ['Send these notes to attendees', false]),
    p('**Next meeting:** [date and time]'),
  ),
};

const cover: TemplateDef = {
  id: 'cover-letter',
  name: 'Cover letter',
  description: 'A concise letter to accompany a job application.',
  category: 'Career',
  typeLabel: 'Cover letter',
  title: 'Cover letter',
  content: doc(
    p('**Your Name**', { ...tight }),
    p('Your address  ·  you@example.com  ·  +00 000 0000000', { spaceAfter: 18 }),
    p('[Date]', { spaceAfter: 14 }),
    p('Hiring manager name', tight),
    p('Company name', tight),
    p('Company address', { spaceAfter: 14 }),
    p('Dear [Hiring manager],'),
    p('I am excited to apply for the [position] role at [company]. Open with one sentence that shows you know the company and why this role fits you.'),
    p('In my work at [previous employer], I [achievement with a number]. That experience taught me [skill], which I would bring to your team from day one.'),
    p('What draws me to [company] is [specific reason]. I would welcome the chance to discuss how I can contribute to [goal or project].'),
    p('Thank you for your time and consideration.', { spaceAfter: 14 }),
    p('Sincerely,', tight),
    p('**Your Name**'),
  ),
};

const assignment: TemplateDef = {
  id: 'academic-assignment',
  name: 'Academic assignment',
  description: 'Title block, structured sections and references.',
  category: 'Education',
  typeLabel: 'Assignment',
  title: 'Academic assignment',
  settings: { pageNumbers: true },
  content: doc(
    title('Assignment title', { textAlign: 'center' }),
    p('Student name  ·  Student ID', { textAlign: 'center', ...tight }),
    p('Course name and code  ·  Instructor name', { textAlign: 'center', ...tight }),
    p('Submission date', { textAlign: 'center', spaceAfter: 18 }),
    h(1, 'Introduction'),
    p('Introduce the topic, explain why it matters, and state your thesis or the question you will answer.', { textAlign: 'justify' }),
    h(1, 'Background'),
    p('Summarize the key ideas, theories or events the reader needs to know. Cite your sources in the style your course requires.', { textAlign: 'justify' }),
    h(1, 'Analysis'),
    p('Develop your argument in focused paragraphs. Each paragraph should make one point and support it with evidence.', { textAlign: 'justify' }),
    h(2, 'First argument'),
    p('Evidence and explanation.', { textAlign: 'justify' }),
    h(2, 'Second argument'),
    p('Evidence and explanation.', { textAlign: 'justify' }),
    h(1, 'Conclusion'),
    p('Restate your thesis in light of the evidence and say what follows from it.', { textAlign: 'justify' }),
    h(1, 'References'),
    ol('Author, A. (Year). *Title of the work*. Publisher.', 'Author, B. (Year). Title of the article. *Journal Name*, volume(issue), pages.'),
  ),
};

const businessLetter: TemplateDef = {
  id: 'business-letter',
  name: 'Business letter',
  description: 'A formal letter with sender, recipient and signature.',
  category: 'Business',
  typeLabel: 'Letter',
  title: 'Business letter',
  content: doc(
    p('**Your Company**', tight),
    p('Street address', tight),
    p('City, Postal code', tight),
    p('contact@example.com  ·  +00 000 0000000', { spaceAfter: 18 }),
    p('[Date]', { spaceAfter: 14 }),
    p('Recipient name', tight),
    p('Recipient title', tight),
    p('Recipient company', tight),
    p('Recipient address', { spaceAfter: 14 }),
    p('**Subject: [Brief subject line]**'),
    p('Dear [Recipient name],'),
    p('State the purpose of your letter in the first sentence. Give the background the reader needs and then the details, one idea per paragraph.'),
    p('Say clearly what you would like the reader to do, and by when. Close politely and offer a way to reach you.'),
    p('Yours sincerely,', { spaceAfter: 28 }),
    p('**Your name**', tight),
    p('Your title'),
  ),
};

const personalLetter: TemplateDef = {
  id: 'personal-letter',
  name: 'Personal letter',
  description: 'A warm, friendly letter to someone you know.',
  category: 'Personal',
  typeLabel: 'Letter',
  title: 'Personal letter',
  content: doc(
    p('[Date]', { textAlign: 'right', spaceAfter: 18 }),
    p('Dear [Name],'),
    p('Start with something personal: a memory, a question, or news since you last spoke.', { lineHeight: 1.7 }),
    p('Share what you have been up to, what you are looking forward to, and what you have been thinking about lately.', { lineHeight: 1.7 }),
    p('Ask about them, too. A good letter makes the other person feel heard.', { lineHeight: 1.7 }),
    p('With love,', { spaceAfter: 22 }),
    p('[Your name]'),
  ),
};

const planner: TemplateDef = {
  id: 'weekly-planner',
  name: 'Weekly planner',
  description: 'Plan your week with goals, a daily table and a checklist.',
  category: 'Personal',
  typeLabel: 'Planner',
  title: 'Weekly planner',
  content: doc(
    title('Week of [date]'),
    subtitle('Three things that matter most this week'),
    ol('Priority one', 'Priority two', 'Priority three'),
    h(2, 'Daily plan'),
    table(['Day', 'Focus', 'Notes'], ['Monday', '', ''], ['Tuesday', '', ''], ['Wednesday', '', ''], ['Thursday', '', ''], ['Friday', '', ''], ['Weekend', '', '']),
    h(2, 'To do'),
    tasks('Task one', 'Task two', 'Task three', ['A finished task', true]),
    hr(),
    p('*Reflection: what worked, what to change next week.*'),
  ),
};

export const TEMPLATES: TemplateDef[] = [
  blank,
  resume,
  proposal,
  report,
  meeting,
  cover,
  assignment,
  businessLetter,
  personalLetter,
  planner,
];

export const getTemplate = (id: string | null | undefined): TemplateDef | undefined => TEMPLATES.find((t) => t.id === id);

export const templateLabel = (id: string | null | undefined): string => getTemplate(id)?.typeLabel ?? 'Document';
