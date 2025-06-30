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

const Root = () => {

  const [questionnaire, setQuestionnaire] = useState({});
  const [formData, setFormData] = useState(initialFormData);

  const handleChange = (section, question, value) => {
    setQuestionnaire(prev => ({
      ...prev,
      [question]: value,
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
      <Observations/>
      <Evidence/>
    </>
  );
};


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
