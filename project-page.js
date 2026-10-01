import './portfolio-interactions.js?v=2';

const projects = {
  'soft-index': {
    title: 'Soft Index',
    category: 'Editorial design · Concept',
    type: '03 / Editorial',
    scope: 'Editorial · Print design',
    summary: 'An editorial identity concept that gives independent culture, images, and ideas room to breathe.',
    story: 'Soft Index explores a quieter approach to printed matter. A flexible typographic system and generous image pacing create an editorial voice that feels tactile, open, and easy to extend.',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=1800&q=85',
    alt: 'Books and printed matter arranged for an editorial design study',
    section: 'design-work',
  },
  passvault: {
    title: 'PassVault',
    category: 'Web application · Development',
    type: '01 / Web app',
    scope: 'JavaScript · Interface development',
    summary: 'A password vault interface with account flows, password generation, and organized credentials.',
    story: 'PassVault brings sign-in, password-strength feedback, credential organization, and a configurable password generator into a single responsive interface. This portfolio entry describes the front-end project in this workspace.',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1800&q=85',
    alt: 'A team collaborating at a laptop on a web application',
    section: 'development-work',
  },
  'field-notes': {
    title: 'Field Notes',
    category: 'Web application · Concept',
    type: '02 / Web app',
    scope: 'Product design · Responsive UI',
    summary: 'A lightweight digital journal designed for quick notes, daily reflections, and ideas worth keeping.',
    story: 'Field Notes is a personal journaling concept centered on a calm writing surface, legible typography, and a simple way to revisit entries. Its responsive layout keeps the writing experience focused across screen sizes.',
    image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1800&q=85',
    alt: 'Open notebook with handwritten notes',
    section: 'development-work',
  },
  daylight: {
    title: 'Daylight',
    category: 'Web application · Concept',
    type: '03 / Web app',
    scope: 'Product design · Front-end development',
    summary: 'A daily planner concept for making space for priorities, routines, and a more deliberate day.',
    story: 'Daylight brings a daily overview, manageable tasks, and recurring routines into a bright, straightforward planner. The interface is designed to make the next step easy to find without adding noise.',
    image: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1800&q=85',
    alt: 'Early morning sunlight over a quiet landscape',
    section: 'development-work',
  },
};

const project = projects[new URLSearchParams(window.location.search).get('project')];
if (!project) {
  window.location.replace('index.html#design-work');
} else {
  document.title = `${project.title} — Soumya Swet`;
  document.querySelector('meta[name="description"]').content = `${project.title}, ${project.category.toLowerCase()}, by Soumya Swet.`;
  document.querySelector('.back-link').href = `index.html#${project.section}`;
  document.querySelector('.detail-contact a').href = `index.html#${project.section}`;
  document.querySelector('#project-kind').textContent = project.category;
  document.querySelector('#detail-title-text').textContent = project.title;
  document.querySelector('#detail-summary').textContent = project.summary;
  document.querySelector('#detail-number').textContent = project.type;
  document.querySelector('#detail-scope').textContent = project.scope;
  document.querySelector('#detail-story').textContent = project.story;
  document.querySelector('#detail-image').src = project.image;
  document.querySelector('#detail-image').alt = project.alt;
  document.querySelector('#video-project-title').textContent = `${project.title} · Project walkthrough`;
  document.querySelector('#project-video').dataset.videoTitle = `${project.title} deployment walkthrough`;
}
