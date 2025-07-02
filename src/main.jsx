import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import GlobalStyles from './global.style.js'
import Header from './components/header/Header'
import ProductSection from './components/productSection/ProductoSection.jsx'
import QuestionnaireSection from './components/QuestionSection/QuestionSection.jsx'
import Inspection from './components/inspection/Inspection.jsx'
import { initialFormData, handleSimpleChange, handleChange } from './components/inspection/Inspection.style.js'
import DefectsSection from './components/defectos/Defectos.jsx'
import Observations from './components/observation/Observation.jsx'
import Evidence from './components/evidence/Evidence.jsx'
import Firmas from './components/firma/Firmas.jsx'
import Buttons from './components/buttons/Buttons.jsx'


const Root = () => {

  const [questionnaire, setQuestionnaire] = useState({});
  const [formData, setFormData] = useState(initialFormData);

  // AGREGAR: Estado para las firmas
  const [signatures, setSignatures] = useState({
    assistant: '',
    chief: ''
  });

  const handleChange = (section, question, value) => {
    setQuestionnaire(prev => ({
      ...prev,
      [question]: value,
    }));

  };
  // AGREGAR: Función para manejar cambios en las firmas
  const handleSignatureChange = (role, value) => {
    console.log(`Signature changed for ${role}:`, value); // Para debug
    setSignatures(prev => ({
      ...prev,
      [role]: value
    }));
  };


  return (
    <>
      <GlobalStyles />
      <Header />
      <ProductSection />
      <QuestionnaireSection
        questionnaire={questionnaire}
        onChange={handleChange}
      />


      {/*   <pre>{JSON.stringify(questionnaire, null, 2)}</pre>    */}
      <Inspection
        formData={formData}
        handleChange={(section, field, value) => handleChange(section, field, value, setFormData)}
        handleSimpleChange={(field, value) => handleSimpleChange(field, value, setFormData)}
      />
      <DefectsSection
        formData={formData}
        handleChange={(section, field, value) => handleChange(section, field, value, setFormData)}
        handleSimpleChange={(field, value) => handleSimpleChange(field, value, setFormData)}
      />
      <Observations />
      <Evidence />
      <Firmas 
        signatures={signatures}
        onSignatureChange={handleSignatureChange} />
      <Buttons />
    </>
  );
};


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
