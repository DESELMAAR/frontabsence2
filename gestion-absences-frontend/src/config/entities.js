
const entities = {
  etudiants: {
    label: "Étudiants",
    basePath: "/api/etudiants",
    id: "id",
    columns: [
      { key: "id", label: "ID" },
      { key: "nom", label: "Nom" },
      { key: "prenom", label: "Prénom" },
      { key: "email", label: "Email" },
      { key: "matricule", label: "Matricule" },
      { key: "address", label: "Adresse" },
      { key: "classe.id", label: "Classe ID" },
    ],
    form: [
      { name: "nom", label: "Nom", type: "text", required: true },
      { name: "prenom", label: "Prénom", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "login", label: "Login", type: "text", required: true },
      { name: "password", label: "Mot de passe", type: "password", required: true, hideOnEdit: true },
      { name: "matricule", label: "Matricule", type: "text", required: true },
      { name: "address", label: "Adresse", type: "text" },
      { name: "classeId", label: "Classe", type: "select", required: true, optionsEndpoint: "/api/classes", mapOption: (c) => ({ value: c.id, label: c.nom }) },
    ],
    mapPayload: (v, isEdit) => {
      const payload = {
        nom: v.nom, prenom: v.prenom, email: v.email, login: v.login,
        matricule: v.matricule, address: v.address || "", classeId: Number(v.classeId)
      }
      if (!isEdit) payload.password = v.password
      return payload
    }
  },
  professeurs: {
    label: "Professeurs",
    basePath: "/api/professeurs",
    id: "id",
    columns: [
      { key: "id", label: "ID" },
      { key: "nom", label: "Nom" },
      { key: "prenom", label: "Prénom" },
      { key: "email", label: "Email" },
      { key: "matricule", label: "Matricule" },
      { key: "specialite", label: "Spécialité" },
      { key: "adresse", label: "Adresse" },
      { key: "dateNaissance", label: "Naissance" },
      { key: "active", label: "Actif" },
    ],
    form: [
      { name: "nom", label: "Nom", type: "text", required: true },
      { name: "prenom", label: "Prénom", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "login", label: "Login", type: "text", required: true },
      { name: "password", label: "Mot de passe", type: "password", required: true, hideOnEdit: true },
      { name: "matricule", label: "Matricule", type: "text", required: true },
      { name: "specialite", label: "Spécialité", type: "text", required: true },
      { name: "adresse", label: "Adresse", type: "text", required: true },
      { name: "dateNaissance", label: "Date de naissance", type: "date" },
    ],
    mapPayload: (v, isEdit) => {
      const p = { nom: v.nom, prenom: v.prenom, email: v.email, login: v.login, matricule: v.matricule, specialite: v.specialite, adresse: v.adresse, dateNaissance: v.dateNaissance || null }
      if (!isEdit) p.password = v.password
      return p
    }
  },
  classes: {
    label: "Classes",
    basePath: "/api/classes",
    id: "id",
    columns: [
      { key: "id", label: "ID" },
      { key: "nom", label: "Nom" },
      { key: "niveau", label: "Niveau" },
    ],
    form: [
      { name: "nom", label: "Nom", type: "text", required: true },
      { name: "niveau", label: "Niveau", type: "text", required: true },
    ],
    mapPayload: (v) => ({ nom: v.nom, niveau: v.niveau })
  },
  matieres: {
    label: "Matières",
    basePath: "/api/matieres",
    id: "id",
    columns: [
      { key: "id", label: "ID" },
      { key: "code", label: "Code" },
      { key: "intitule", label: "Intitulé" },
      { key: "domaine", label: "Domaine" },
    ],
    form: [
      { name: "code", label: "Code", type: "text", required: true },
      { name: "intitule", label: "Intitulé", type: "text", required: true },
      { name: "domaine", label: "Domaine", type: "text" },
    ],
    mapPayload: (v) => ({ code: v.code, intitule: v.intitule, domaine: v.domaine || "" })
  },
  salles: {
    label: "Salles",
    basePath: "/api/salles",
    id: "id",
    columns: [
      { key: "id", label: "ID" },
      { key: "code", label: "Code" },
      { key: "batiment", label: "Bâtiment" },
      { key: "numero", label: "Numéro" },
      { key: "capacite", label: "Capacité" },
      { key: "type", label: "Type" },
    ],
    form: [
      { name: "code", label: "Code", type: "text", required: true },
      { name: "batiment", label: "Bâtiment", type: "text", required: true },
      { name: "numero", label: "Numéro", type: "text", required: true },
      { name: "capacite", label: "Capacité", type: "number", required: true },
      { name: "type", label: "Type", type: "text", required: true },
    ],
    mapPayload: (v) => ({ code: v.code, batiment: v.batiment, numero: v.numero, capacite: Number(v.capacite), type: v.type })
  },
  cours: {
    label: "Cours",
    basePath: "/api/cours",
    id: "id",
    columns: [
      { key: "id", label: "ID" },
      { key: "code", label: "Code" },
      { key: "intitule", label: "Intitulé" },
      { key: "description", label: "Description" },
      { key: "coefficient", label: "Coef" },
      { key: "volumeHoraire", label: "Volume h" },
      { key: "matiere.id", label: "Matière ID" },
      { key: "classe.id", label: "Classe ID" },
      { key: "professeur.id", label: "Prof ID" },
    ],
    form: [
      { name: "code", label: "Code", type: "text", required: true },
      { name: "intitule", label: "Intitulé", type: "text", required: true },
      { name: "description", label: "Description", type: "text" },
      { name: "coefficient", label: "Coefficient", type: "number" },
      { name: "volumeHoraire", label: "Volume horaire", type: "number" },
      { name: "matiereId", label: "Matière", type: "select", required: true, optionsEndpoint: "/api/matieres", mapOption: (m) => ({ value: m.id, label: m.intitule }) },
      { name: "classeId", label: "Classe", type: "select", optionsEndpoint: "/api/classes", mapOption: (c) => ({ value: c.id, label: c.nom }) },
      // professeurId optionnel (actuellement DTO non inclus par défaut)
    ],
    mapPayload: (v) => {
      const p = { code: v.code, intitule: v.intitule, description: v.description || "", coefficient: v.coefficient ? Number(v.coefficient) : null, volumeHoraire: v.volumeHoraire ? Number(v.volumeHoraire) : null, matiereId: Number(v.matiereId) }
      if (v.classeId) p.classeId = Number(v.classeId)
      return p
    }
  },
  seances: {
    label: "Séances",
    basePath: "/api/seances",
    id: "id",
    columns: [
      { key: "id", label: "ID" },
      { key: "date", label: "Date" },
      { key: "heureDebut", label: "Début" },
      { key: "heureFin", label: "Fin" },
      { key: "statut", label: "Statut" },
      { key: "coursId", label: "Cours ID" },
      { key: "professeurId", label: "Prof ID" },
      { key: "salleId", label: "Salle ID" },
      { key: "emploiDuTempsId", label: "EDT ID" },
    ],
    form: [
      { name: "coursId", label: "Cours", type: "select", required: true, optionsEndpoint: "/api/cours", mapOption: (c) => ({ value: c.id, label: `${c.code} - ${c.intitule}` }) },
      { name: "professeurId", label: "Professeur", type: "select", required: true, optionsEndpoint: "/api/professeurs", mapOption: (p) => ({ value: p.id, label: `${p.nom} ${p.prenom}` }) },
      { name: "salleId", label: "Salle", type: "select", required: true, optionsEndpoint: "/api/salles", mapOption: (s) => ({ value: s.id, label: `${s.code} (${s.capacite})` }) },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "heureDebut", label: "Heure début", type: "time", required: true },
      { name: "heureFin", label: "Heure fin", type: "time", required: true },
      {
        name: "statut", label: "Statut", type: "select", options: [
          { value: "PLANIFIEE", label: "PLANIFIEE" },
          { value: "EFFECTUEE", label: "EFFECTUEE" },
          { value: "ANNULEE", label: "ANNULEE" },
          { value: "REPORTEE", label: "REPORTEE" },
        ]
      }
    ],
    mapPayload: (v) => ({ coursId: Number(v.coursId), professeurId: Number(v.professeurId), salleId: Number(v.salleId), date: v.date, heureDebut: v.heureDebut, heureFin: v.heureFin, statut: v.statut || "PLANIFIEE" }),
    extraActions: [
      {
        label: "Vérifier conflit",
        run: async (api, values) => {
          const payload = {
            coursId: Number(values.coursId),
            professeurId: Number(values.professeurId),
            salleId: Number(values.salleId),
            date: values.date,
            heureDebut: values.heureDebut,
            heureFin: values.heureFin,
            statut: values.statut || "PLANIFIEE"
          }
          const { data } = await api.post('/api/seances/check-conflict', payload)
          return data
        }
      }
    ]
  },
}
export default entities
