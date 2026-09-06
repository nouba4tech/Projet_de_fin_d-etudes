const fs = require('fs');
let content = fs.readFileSync('components/Bar.tsx', 'utf8');

const replacements = [
  {
    find: /<button onClick=\{\(\) => alert\('Fonctionnalité en cours de développement'\)\}>Voir<\/button>/g,
    replace: `<button className="text-blue-400 hover:text-blue-300 mr-3 text-sm" onClick={() => alert('Fonctionnalité en cours de développement')}>Voir</button>`
  },
  {
    find: /<button onClick=\{\(\) => alert\('Fonctionnalité en cours de développement'\)\}>Payer<\/button>/g,
    replace: `<button className="text-green-400 hover:text-green-300 mr-3 text-sm" onClick={() => alert('Fonctionnalité en cours de développement')}>Payer</button>`
  },
  {
    find: /<button onClick=\{\(\) => alert\('Fonctionnalité en cours de développement'\)\}>Imprimer<\/button>/g,
    replace: `<button className="text-green-400 hover:text-green-300 mr-3 text-sm" onClick={() => window.print()}>Imprimer</button>`
  },
  {
    find: /<button onClick=\{\(\) => window\.print\(\)\}>Imprimer<\/button>/g,
    replace: `<button className="text-green-400 hover:text-green-300 mr-3 text-sm" onClick={() => window.print()}>Imprimer</button>`
  },
  {
    find: /<button onClick=\{\(\) => alert\('Fonctionnalité en cours de développement'\)\}>Email<\/button>/g,
    replace: `<button className="text-gray-400 hover:text-gray-200 text-sm" onClick={() => alert('Fonctionnalité en cours de développement')}>Email</button>`
  },
  {
    find: /<button onClick=\{\(\) => alert\('Fonctionnalité en cours de développement'\)\}>\s*Nouvelle entrée\s*<\/button>/g,
    replace: `<button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors" onClick={() => alert('Fonctionnalité en cours de développement')}>Nouvelle entrée</button>`
  },
  {
    find: /<button onClick=\{\(\) => alert\('Fonctionnalité en cours de développement'\)\}>Détails<\/button>/g,
    replace: `<button className="text-blue-400 hover:text-blue-300 mr-3 text-sm" onClick={() => alert('Fonctionnalité en cours de développement')}>Détails</button>`
  },
  {
    find: /<button onClick=\{\(\) => alert\('Fonctionnalité en cours de développement'\)\}>Modifier<\/button>/g,
    replace: `<button className="text-green-400 hover:text-green-300 mr-3 text-sm" onClick={() => alert('Fonctionnalité en cours de développement')}>Modifier</button>`
  },
  {
    find: /<button onClick=\{\(\) => alert\('Fonctionnalité en cours de développement'\)\}>Historique<\/button>/g,
    replace: `<button className="text-blue-400 hover:text-blue-300 text-sm font-medium" onClick={() => alert('Fonctionnalité en cours de développement')}>Historique</button>`
  },
  {
    find: /<button onClick=\{\(\) => alert\('Fonctionnalité en cours de développement'\)\}>Approuver<\/button>/g,
    replace: `<button className="text-green-400 hover:text-green-300 mr-3 text-sm font-medium" onClick={() => alert('Fonctionnalité en cours de développement')}>Approuver</button>`
  },
  {
    find: /<button onClick=\{\(\) => alert\('Fonctionnalité en cours de développement'\)\}>Refuser<\/button>/g,
    replace: `<button className="text-red-400 hover:text-red-300 mr-3 text-sm font-medium" onClick={() => alert('Fonctionnalité en cours de développement')}>Refuser</button>`
  },
  {
    find: /<button onClick=\{\(\) => alert\('Fonctionnalité en cours de développement'\)\}>\s*Rechercher\s*<\/button>/g,
    replace: `<button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors" onClick={() => alert('Fonctionnalité en cours de développement')}>Rechercher</button>`
  },
  {
    find: /<button onClick=\{\(\) => alert\('Fonctionnalité en cours de développement'\)\}>\s*Filtrer\s*<\/button>/g,
    replace: `<button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap" onClick={() => alert('Fonctionnalité en cours de développement')}>Filtrer</button>`
  },
  {
    find: /<button onClick=\{\(\) => alert\('Fonctionnalité en cours de développement'\)\}>\s*Exporter Excel\s*<\/button>/g,
    replace: `<button className="border border-gray-600/50 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-white/5 transition-colors whitespace-nowrap" onClick={() => alert('Fonctionnalité en cours de développement')}>Exporter Excel</button>`
  },
  {
    find: /<button onClick=\{\(\) => alert\('Fonctionnalité en cours de développement'\)\}>\s*Nouvelle caisse\s*<\/button>/g,
    replace: `<button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors" onClick={() => alert('Fonctionnalité en cours de développement')}>Nouvelle caisse</button>`
  },
  {
    find: /<button onClick=\{\(\) => alert\('Fonctionnalité en cours de développement'\)\}>\s*Nouveau transfert\s*<\/button>/g,
    replace: `<button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors" onClick={() => alert('Fonctionnalité en cours de développement')}>Nouveau transfert</button>`
  },
  {
    find: /<button onClick=\{\(\) => alert\('Fonctionnalité en cours de développement'\)\}>\s*Mouvement\s*<\/button>/g,
    replace: `<button className="bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors" onClick={() => alert('Fonctionnalité en cours de développement')}>Mouvement</button>`
  }
];

replacements.forEach(({find, replace}) => {
  content = content.replace(find, replace);
});

fs.writeFileSync('components/Bar.tsx', content);
console.log('Restored all classes correctly');
