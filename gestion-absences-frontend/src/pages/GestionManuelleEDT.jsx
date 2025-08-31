import { useEffect, useState } from 'react'
import api from '../services/api'
import React from "react";
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';

export default function GestionManuelleEDT() {
  const { user } = useAuth();
  const [edts, setEdts] = useState([]);
  const [classes, setClasses] = useState([]);
  const [cours, setCours] = useState([]);
  const [professeurs, setProfesseurs] = useState([]);
  const [salles, setSalles] = useState([]);
  const [selectedEdt, setSelectedEdt] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddSeanceModal, setShowAddSeanceModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Formulaire création EDT
  const [newEdt, setNewEdt] = useState({
    intitule: '',
    classeId: '',
    dateDebut: '',
    dateFin: ''
  });

  // Formulaire ajout séance (ajout color)
  const [newSeance, setNewSeance] = useState({
    coursId: '',
    professeurId: '',
    salleId: '',
    date: '',
    heureDebut: '',
    heureFin: '',
    statut: 'PLANIFIEE',
    color: '' // optionnel
  });

  const isAdmin = user?.role === 'ROLE_ADMIN';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [edtsRes, classesRes, coursRes, professeursRes, sallesRes] = await Promise.all([
        api.get('/api/emploi-du-temps'),
        api.get('/api/classes'),
        api.get('/api/cours'),
        api.get('/api/professeurs'),
        api.get('/api/salles')
      ]);
      setEdts(edtsRes.data);
      setClasses(classesRes.data);
      setCours(coursRes.data);
      setProfesseurs(professeursRes.data);
      setSalles(sallesRes.data);
    } catch (e) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const createEmploiDuTemps = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/emploi-du-temps', null, {
        params: {
          intitule: newEdt.intitule,
          classeId: newEdt.classeId,
          dateDebut: newEdt.dateDebut,
          dateFin: newEdt.dateFin
        }
      });
      setEdts([...edts, response.data]);
      setShowCreateModal(false);
      setNewEdt({ intitule: '', classeId: '', dateDebut: '', dateFin: '' });
      setMessage('Emploi du temps créé avec succès');
    } catch (e) {
      setError(e?.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const addSeance = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(`/api/emploi-du-temps/${selectedEdt.id}/seances`, newSeance);
      const updatedEdts = edts.map(edt => edt.id === selectedEdt.id ? response.data : edt);
      setEdts(updatedEdts);
      setSelectedEdt(response.data);
      setShowAddSeanceModal(false);
      setNewSeance({ coursId: '', professeurId: '', salleId: '', date: '', heureDebut: '', heureFin: '', statut: 'PLANIFIEE', color: '' });
      setMessage('Séance ajoutée avec succès');
    } catch (e) {
      setError(e?.response?.data?.message || 'Erreur lors de l\'ajout de la séance');
    }
  };

  const deleteEmploiDuTemps = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet emploi du temps ?')) return;
    try {
      await api.delete(`/api/emploi-du-temps/${id}`);
      setEdts(edts.filter(edt => edt.id !== id));
      setMessage('Emploi du temps supprimé avec succès');
    } catch (e) {
      setError('Erreur lors de la suppression');
    }
  };

  const removeSeance = async (seanceId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette séance ?')) return;
    try {
      const response = await api.delete(`/api/emploi-du-temps/${selectedEdt.id}/seances/${seanceId}`);
      setSelectedEdt(response.data);
      const updatedEdts = edts.map(edt => edt.id === selectedEdt.id ? response.data : edt);
      setEdts(updatedEdts);
      setMessage('Séance supprimée avec succès');
    } catch (e) {
      setError('Erreur lors de la suppression de la séance');
    }
  };

  if (loading) return <div className="p-4 text-center">Chargement...</div>;

  return (
    <div className="space-y-6 bg-black bg-opacity-30 p-4 rounded-xl">
      <div className="flex justify-between items-center">
        <h1 className="title text-white/90">Gestion Manuelle des Emplois du Temps</h1>
        {isAdmin && (
          <button className="btn bg-lime-600 btn-primary" onClick={() => setShowCreateModal(true)}>
            + Nouvel Emploi Du Temps
          </button>
        )}
      </div>

      {message && <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl">{message}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {edts.map(edt => (
          <div key={edt.id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{edt.intitule}</h3>
                <p className="text-sm text-gray-600">
                  Classe: {edt.classe?.nom} | Période: {edt.dateDebut} → {edt.dateFin}
                </p>
                <p className="text-sm text-gray-600">
                  {edt.seances?.length || 0} séance(s) planifiée(s)
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn"
                  onClick={() => setSelectedEdt(selectedEdt?.id === edt.id ? null : edt)}
                >
                  {selectedEdt?.id === edt.id ? 'Masquer' : 'Voir'}
                </button>
                {isAdmin && (
                  <button
                    className="btn btn-danger"
                    onClick={() => deleteEmploiDuTemps(edt.id)}
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>

            {selectedEdt?.id === edt.id && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold">Séances planifiées</h4>
                  {isAdmin && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowAddSeanceModal(true)}
                    >
                      + Ajouter une séance
                    </button>
                  )}
                </div>

                {selectedEdt.seances && selectedEdt.seances.length > 0 ? (
                  <div className="space-y-2">
                    {selectedEdt.seances.map(seance => (
                      <div key={seance.id} className="p-3 border rounded-lg" style={{ backgroundColor: seance.color || undefined }}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p><strong>Date:</strong> {seance.date}</p>
                            <p><strong>Horaire:</strong> {seance.heureDebut} - {seance.heureFin}</p>
                            <p><strong>Cours:</strong> {seance.cours?.intitule}</p>
                            <p><strong>Professeur:</strong> {seance.professeur ? `${seance.professeur.nom} ${seance.professeur.prenom}` : 'Non assigné'}</p>
                            <p><strong>Salle:</strong> {seance.salle?.code || seance.salle?.nom}</p>
                            <p><strong>Statut:</strong> {seance.statut}</p>
                            {seance.color && <p><strong>Couleur:</strong> {seance.color}</p>}
                          </div>
                          {isAdmin && (
                            <button
                              className="btn btn-danger text-sm"
                              onClick={() => removeSeance(seance.id)}
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Aucune séance planifiée</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de création d'EDT */}
      <Modal open={showCreateModal} title="Créer un nouvel emploi du temps" onClose={() => setShowCreateModal(false)}>
        <form onSubmit={createEmploiDuTemps} className="space-y-3">
          <div>
            <label className="label">Intitulé</label>
            <input
              className="input"
              value={newEdt.intitule}
              onChange={e => setNewEdt({...newEdt, intitule: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="label">Classe</label>
            <select
              className="input"
              value={newEdt.classeId}
              onChange={e => setNewEdt({...newEdt, classeId: e.target.value})}
              required
            >
              <option value="">Sélectionner une classe</option>
              {classes.map(classe => (
                <option key={classe.id} value={classe.id}>{classe.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date de début</label>
            <input
              className="input"
              type="date"
              value={newEdt.dateDebut}
              onChange={e => setNewEdt({...newEdt, dateDebut: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="label">Date de fin</label>
            <input
              className="input"
              type="date"
              value={newEdt.dateFin}
              onChange={e => setNewEdt({...newEdt, dateFin: e.target.value})}
              required
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">Créer</button>
            <button type="button" className="btn" onClick={() => setShowCreateModal(false)}>Annuler</button>
          </div>
        </form>
      </Modal>

      {/* Modal d'ajout de séance */}
      <Modal open={showAddSeanceModal} title="Ajouter une séance" onClose={() => setShowAddSeanceModal(false)}>
        <form onSubmit={addSeance} className="space-y-3">
          <div>
            <label className="label">Cours</label>
            <select
              className="input"
              value={newSeance.coursId}
              onChange={e => setNewSeance({...newSeance, coursId: Number(e.target.value)})}
              required
            >
              <option value="">Sélectionner un cours</option>
              {cours.map(cours => (
                <option key={cours.id} value={cours.id}>
                  {cours.code} - {cours.intitule}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Professeur</label>
            <select
              className="input"
              value={newSeance.professeurId}
              onChange={e => setNewSeance({...newSeance, professeurId: Number(e.target.value)})}
              required
            >
              <option value="">Sélectionner un professeur</option>
              {professeurs.map(prof => (
                <option key={prof.id} value={prof.id}>
                  {prof.nom} {prof.prenom}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Salle</label>
            <select
              className="input"
              value={newSeance.salleId}
              onChange={e => setNewSeance({...newSeance, salleId: Number(e.target.value)})}
              required
            >
              <option value="">Sélectionner une salle</option>
              {salles.map(salle => (
                <option key={salle.id} value={salle.id}>
                  {salle.code} ({salle.capacite} places)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input
              className="input"
              type="date"
              value={newSeance.date}
              onChange={e => setNewSeance({...newSeance, date: e.target.value})}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Heure de début</label>
              <input
                className="input"
                type="time"
                value={newSeance.heureDebut}
                onChange={e => setNewSeance({...newSeance, heureDebut: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="label">Heure de fin</label>
              <input
                className="input"
                type="time"
                value={newSeance.heureFin}
                onChange={e => setNewSeance({...newSeance, heureFin: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Picker couleur optionnel */}
          <div>
            <label className="label">Couleur (optionnel)</label>
            <input
              className="input p-0 h-10 w-16"
              type="color"
              value={newSeance.color || '#D9F99D'}
              onChange={e => setNewSeance({...newSeance, color: e.target.value})}
            />
          </div>

          <div>
            <label className="label">Statut</label>
            <select
              className="input"
              value={newSeance.statut}
              onChange={e => setNewSeance({...newSeance, statut: e.target.value})}
            >
              <option value="PLANIFIEE">Planifiée</option>
              <option value="EFFECTUEE">Effectuée</option>
              <option value="ANNULEE">Annulée</option>
              <option value="REPORTEE">Reportée</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">Ajouter</button>
            <button type="button" className="btn" onClick={() => setShowAddSeanceModal(false)}>Annuler</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


// import { useEffect, useState } from 'react'
// import api from '../services/api'
// import React from "react";
// import { useAuth } from '../contexts/AuthContext';
// import Modal from '../components/Modal';

// export default function GestionManuelleEDT() {
//   const { user } = useAuth();
//   const [edts, setEdts] = useState([]);
//   const [classes, setClasses] = useState([]);
//   const [cours, setCours] = useState([]);
//   const [professeurs, setProfesseurs] = useState([]);
//   const [salles, setSalles] = useState([]);
//   const [selectedEdt, setSelectedEdt] = useState(null);
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showAddSeanceModal, setShowAddSeanceModal] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState(null);

//   // Formulaire création EDT
//   const [newEdt, setNewEdt] = useState({
//     intitule: '',
//     classeId: '',
//     dateDebut: '',
//     dateFin: ''
//   });

//   // Formulaire ajout séance
//   const [newSeance, setNewSeance] = useState({
//     coursId: '',
//     professeurId: '',
//     salleId: '',
//     date: '',
//     heureDebut: '',
//     heureFin: '',
//     statut: 'PLANIFIEE'
//   });

//   const isAdmin = user?.role === 'ROLE_ADMIN';

//   useEffect(() => {
//     loadData();
//   }, []);

//   const loadData = async () => {
//     try {
//       setLoading(true);
//       const [edtsRes, classesRes, coursRes, professeursRes, sallesRes] = await Promise.all([
//         api.get('/api/emploi-du-temps'),
//         api.get('/api/classes'),
//         api.get('/api/cours'),
//         api.get('/api/professeurs'),
//         api.get('/api/salles')
//       ]);
      
//       setEdts(edtsRes.data);
//       setClasses(classesRes.data);
//       setCours(coursRes.data);
//       setProfesseurs(professeursRes.data);
//       setSalles(sallesRes.data);
//     } catch (e) {
//       setError('Erreur lors du chargement des données');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const createEmploiDuTemps = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await api.post('/api/emploi-du-temps', null, {
//         params: {
//           intitule: newEdt.intitule,
//           classeId: newEdt.classeId,
//           dateDebut: newEdt.dateDebut,
//           dateFin: newEdt.dateFin
//         }
//       });
      
//       setEdts([...edts, response.data]);
//       setShowCreateModal(false);
//       setNewEdt({ intitule: '', classeId: '', dateDebut: '', dateFin: '' });
//       setMessage('Emploi du temps créé avec succès');
//     } catch (e) {
//       setError(e?.response?.data?.message || 'Erreur lors de la création');
//     }
//   };

//   const addSeance = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await api.post(`/api/emploi-du-temps/${selectedEdt.id}/seances`, newSeance);
      
//       // Mettre à jour la liste des EDTs
//       const updatedEdts = edts.map(edt => 
//         edt.id === selectedEdt.id ? response.data : edt
//       );
      
//       setEdts(updatedEdts);
//       setSelectedEdt(response.data);
//       setShowAddSeanceModal(false);
//       setNewSeance({ coursId: '', professeurId: '', salleId: '', date: '', heureDebut: '', heureFin: '', statut: 'PLANIFIEE' });
//       setMessage('Séance ajoutée avec succès');
//     } catch (e) {
//       setError(e?.response?.data?.message || 'Erreur lors de l\'ajout de la séance');
//     }
//   };

//   const deleteEmploiDuTemps = async (id) => {
//     if (!confirm('Êtes-vous sûr de vouloir supprimer cet emploi du temps ?')) return;
    
//     try {
//       await api.delete(`/api/emploi-du-temps/${id}`);
//       setEdts(edts.filter(edt => edt.id !== id));
//       setMessage('Emploi du temps supprimé avec succès');
//     } catch (e) {
//       setError('Erreur lors de la suppression');
//     }
//   };

//   const removeSeance = async (seanceId) => {
//     if (!confirm('Êtes-vous sûr de vouloir supprimer cette séance ?')) return;
    
//     try {
//       const response = await api.delete(`/api/emploi-du-temps/${selectedEdt.id}/seances/${seanceId}`);
//       setSelectedEdt(response.data);
      
//       // Mettre à jour la liste des EDTs
//       const updatedEdts = edts.map(edt => 
//         edt.id === selectedEdt.id ? response.data : edt
//       );
      
//       setEdts(updatedEdts);
//       setMessage('Séance supprimée avec succès');
//     } catch (e) {
//       setError('Erreur lors de la suppression de la séance');
//     }
//   };

//   if (loading) return <div className="p-4 text-center">Chargement...</div>;

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <h1 className="title">Gestion Manuelle des Emplois du Temps</h1>
//         {isAdmin && (
//           <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
//             + Nouvel EDT
//           </button>
//         )}
//       </div>

//       {message && <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl">{message}</div>}
//       {error && <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl">{error}</div>}

//       {/* Liste des emplois du temps */}
//       <div className="grid gap-4">
//         {edts.map(edt => (
//           <div key={edt.id} className="card">
//             <div className="flex justify-between items-start">
//               <div>
//                 <h3 className="font-semibold text-lg">{edt.intitule}</h3>
//                 <p className="text-sm text-gray-600">
//                   Classe: {edt.classe?.nom} | Période: {edt.dateDebut} → {edt.dateFin}
//                 </p>
//                 <p className="text-sm text-gray-600">
//                   {edt.seances?.length || 0} séance(s) planifiée(s)
//                 </p>
//               </div>
//               <div className="flex gap-2">
//                 <button 
//                   className="btn"
//                   onClick={() => setSelectedEdt(selectedEdt?.id === edt.id ? null : edt)}
//                 >
//                   {selectedEdt?.id === edt.id ? 'Masquer' : 'Voir'}
//                 </button>
//                 {isAdmin && (
//                   <button 
//                     className="btn btn-danger"
//                     onClick={() => deleteEmploiDuTemps(edt.id)}
//                   >
//                     Supprimer
//                   </button>
//                 )}
//               </div>
//             </div>

//             {/* Détails de l'EDT sélectionné */}
//             {selectedEdt?.id === edt.id && (
//               <div className="mt-4">
//                 <div className="flex justify-between items-center mb-4">
//                   <h4 className="font-semibold">Séances planifiées</h4>
//                   {isAdmin && (
//                     <button 
//                       className="btn btn-primary"
//                       onClick={() => setShowAddSeanceModal(true)}
//                     >
//                       + Ajouter une séance
//                     </button>
//                   )}
//                 </div>

//                 {selectedEdt.seances && selectedEdt.seances.length > 0 ? (
//                   <div className="space-y-2">
//                     {selectedEdt.seances.map(seance => (
//                       <div key={seance.id} className="p-3 border rounded-lg">
//                         <div className="flex justify-between items-start">
//                           <div>
//                             <p><strong>Date:</strong> {seance.date}</p>
//                             <p><strong>Horaire:</strong> {seance.heureDebut} - {seance.heureFin}</p>
//                             <p><strong>Cours:</strong> {seance.cours?.intitule}</p>
//                             <p><strong>Professeur:</strong> {seance.professeur ? `${seance.professeur.nom} ${seance.professeur.prenom}` : 'Non assigné'}</p>
//                             <p><strong>Salle:</strong> {seance.salle?.code || seale.salle?.nom}</p>
//                             <p><strong>Statut:</strong> {seance.statut}</p>
//                           </div>
//                           {isAdmin && (
//                             <button 
//                               className="btn btn-danger text-sm"
//                               onClick={() => removeSeance(seance.id)}
//                             >
//                               Supprimer
//                             </button>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <p className="text-gray-500 text-center py-4">Aucune séance planifiée</p>
//                 )}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>

//       {/* Modal de création d'EDT */}
//       <Modal open={showCreateModal} title="Créer un nouvel emploi du temps" onClose={() => setShowCreateModal(false)}>
//         <form onSubmit={createEmploiDuTemps} className="space-y-3">
//           <div>
//             <label className="label">Intitulé</label>
//             <input
//               className="input"
//               value={newEdt.intitule}
//               onChange={e => setNewEdt({...newEdt, intitule: e.target.value})}
//               required
//             />
//           </div>
//           <div>
//             <label className="label">Classe</label>
//             <select
//               className="input"
//               value={newEdt.classeId}
//               onChange={e => setNewEdt({...newEdt, classeId: e.target.value})}
//               required
//             >
//               <option value="">Sélectionner une classe</option>
//               {classes.map(classe => (
//                 <option key={classe.id} value={classe.id}>{classe.nom}</option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label className="label">Date de début</label>
//             <input
//               className="input"
//               type="date"
//               value={newEdt.dateDebut}
//               onChange={e => setNewEdt({...newEdt, dateDebut: e.target.value})}
//               required
//             />
//           </div>
//           <div>
//             <label className="label">Date de fin</label>
//             <input
//               className="input"
//               type="date"
//               value={newEdt.dateFin}
//               onChange={e => setNewEdt({...newEdt, dateFin: e.target.value})}
//               required
//             />
//           </div>
//           <div className="flex gap-2">
//             <button type="submit" className="btn btn-primary">Créer</button>
//             <button type="button" className="btn" onClick={() => setShowCreateModal(false)}>Annuler</button>
//           </div>
//         </form>
//       </Modal>

//       {/* Modal d'ajout de séance */}
//       <Modal open={showAddSeanceModal} title="Ajouter une séance" onClose={() => setShowAddSeanceModal(false)}>
//         <form onSubmit={addSeance} className="space-y-3">
//           <div>
//             <label className="label">Cours</label>
//             <select
//               className="input"
//               value={newSeance.coursId}
//               onChange={e => setNewSeance({...newSeance, coursId: e.target.value})}
//               required
//             >
//               <option value="">Sélectionner un cours</option>
//               {cours.map(cours => (
//                 <option key={cours.id} value={cours.id}>
//                   {cours.code} - {cours.intitule}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label className="label">Professeur</label>
//             <select
//               className="input"
//               value={newSeance.professeurId}
//               onChange={e => setNewSeance({...newSeance, professeurId: e.target.value})}
//               required
//             >
//               <option value="">Sélectionner un professeur</option>
//               {professeurs.map(prof => (
//                 <option key={prof.id} value={prof.id}>
//                   {prof.nom} {prof.prenom}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label className="label">Salle</label>
//             <select
//               className="input"
//               value={newSeance.salleId}
//               onChange={e => setNewSeance({...newSeance, salleId: e.target.value})}
//               required
//             >
//               <option value="">Sélectionner une salle</option>
//               {salles.map(salle => (
//                 <option key={salle.id} value={salle.id}>
//                   {salle.code} ({salle.capacite} places)
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label className="label">Date</label>
//             <input
//               className="input"
//               type="date"
//               value={newSeance.date}
//               onChange={e => setNewSeance({...newSeance, date: e.target.value})}
//               required
//             />
//           </div>
//           <div className="grid grid-cols-2 gap-3">
//             <div>
//               <label className="label">Heure de début</label>
//               <input
//                 className="input"
//                 type="time"
//                 value={newSeance.heureDebut}
//                 onChange={e => setNewSeance({...newSeance, heureDebut: e.target.value})}
//                 required
//               />
//             </div>
//             <div>
//               <label className="label">Heure de fin</label>
//               <input
//                 className="input"
//                 type="time"
//                 value={newSeance.heureFin}
//                 onChange={e => setNewSeance({...newSeance, heureFin: e.target.value})}
//                 required
//               />
//             </div>
//           </div>
//           <div>
//             <label className="label">Statut</label>
//             <select
//               className="input"
//               value={newSeance.statut}
//               onChange={e => setNewSeance({...newSeance, statut: e.target.value})}
//             >
//               <option value="PLANIFIEE">Planifiée</option>
//               <option value="EFFECTUEE">Effectuée</option>
//               <option value="ANNULEE">Annulée</option>
//               <option value="REPORTEE">Reportée</option>
//             </select>
//           </div>
//           <div className="flex gap-2">
//             <button type="submit" className="btn btn-primary">Ajouter</button>
//             <button type="button" className="btn" onClick={() => setShowAddSeanceModal(false)}>Annuler</button>
//           </div>
//         </form>
//       </Modal>
//     </div>
//   );
// }