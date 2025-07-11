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


  // AGREGAR: Estado para ProductSection
  const [productData, setProductData] = useState({
    product: '',
    lot: '',
    date: '',
    area: ''
  });

  // AGREGAR: Estado para las firmas
  const [signatures, setSignatures] = useState({
    assistant: '',
    chief: ''
  });

  // Estado para observaciones
  const [observations, setObservations] = useState('');

  // Función para manejar cambios en el cuestionario
  const handleQuestionnaireChange = (section, question, value) => {
    setQuestionnaire(prev => ({
      ...prev,
      [question]: value,
    }));
  };
  // AGREGAR: Funciones para manejar cambios en ProductSection
  const handleProductDataChange = (field, value) => {
    setProductData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para manejar cambios en los defectos
  const handleDefectChange = (defectType, index, value) => {
    console.log(`Defect change: ${defectType}, index: ${index}, value:`, value);

    setFormData(prev => ({
      ...prev,
      [defectType]: {
        ...prev[defectType],
        [index]: {
          ...prev[defectType]?.[index],
          ...value
        }
      }
    }));
  };

  // Función para manejar cambios en las firmas
  const handleSignatureChange = (role, value) => {
    console.log(`Signature changed for ${role}:`, value); // Para debug
    setSignatures(prev => ({
      ...prev,
      [role]: value
    }));
  };


  const handleChange = (section, question, value) => {
    setQuestionnaire(prev => ({
      ...prev,
      [question]: value,
    }));
  };

  // Función para manejar cambios en observaciones
  const handleObservationsChange = (value) => {
    setObservations(value);
  };
  const [images, setImages] = useState([]);

  // Agregar imágenes nuevas
  const handleAddImages = (newImages) => {
    setImages((prev) => [...prev, ...newImages]);
  };

  // Eliminar una imagen individual
  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Eliminar múltiples imágenes seleccionadas
  const handleRemoveSelectedImages = (selectedIndexes) => {
    setImages((prev) => prev.filter((_, i) => !selectedIndexes.includes(i)));
  };


  // Consolidar todos los datos para el PDF
  const consolidatedFormData = {
    ...formData,
    ...productData,
    questionnaire,
    signatures,
    observations,
    images
  };


  return (
    <>
      <GlobalStyles />
      <Header />
      <ProductSection
        product={productData.product}
        lot={productData.lot}
        date={productData.date}
        area={productData.area}
        onProductChange={(value) => handleProductDataChange('product', value)}
        onLotChange={(value) => handleProductDataChange('lot', value)}
        onDateChange={(value) => handleProductDataChange('date', value)}
        onAreaChange={(value) => handleProductDataChange('area', value)}
      />
      <QuestionnaireSection
        questionnaire={questionnaire}
        onChange={handleQuestionnaireChange}
      />


      {/*   <pre>{JSON.stringify(questionnaire, null, 2)}</pre>    */}
      <Inspection
        formData={formData}
        handleChange={(section, field, value) => handleChange(section, field, value, setFormData)}
        handleSimpleChange={(field, value) => handleSimpleChange(field, value, setFormData)}
      />
      <DefectsSection
        formData={formData}
        handleChange={handleDefectChange}
        handleSimpleChange={(field, value) => handleSimpleChange(field, value, setFormData)}
      />
      <Observations
        observations={observations}
        onChange={handleObservationsChange}
      />
      <Evidence
        images={images}
        onAddImages={(newImgs) => setImages(prev => [...prev, ...newImgs])}
        onRemoveImage={(i) => setImages(prev => prev.filter((_, idx) => idx !== i))}
        onRemoveSelectedImages={(selected) => setImages(prev => prev.filter((_, i) => !selected.includes(i)))}
      />
      <Firmas
        signatures={signatures}
        onSignatureChange={handleSignatureChange} />
      <Buttons
        formData={{
          ...formData,
          ...productData, // Datos del producto

          questionnaire, // C y NC
          images,        // imágenes de evidencias
          signatures,     // imágenes base64 de las firmas
          observations 
        }}
      />
    </>
  );
};


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
