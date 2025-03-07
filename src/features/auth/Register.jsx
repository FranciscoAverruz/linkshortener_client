/* eslint-disable no-unused-vars */
import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MdAlternateEmail } from "react-icons/md";
import { FaRegUser } from "react-icons/fa";
import SubmitButton from "@molecules/SubmitButton.jsx";
import useRegister from "@hooks/useRegister.jsx";
import Button from "@atoms/Button.jsx";
import PricingModal from "@common/PricingModal";
import border from "@assets/border.webp";
import avatar from "@assets/avatar.jpg";
import AuthLayout from "@auth/AuthLayout";
import Input from "@molecules/Input.jsx"; 
import useCheckoutSession from "@hooks/useCheckoutSession.jsx";
import PasswordValidation from "@dashCommon/PasswordValidation";

import { useStripe, useElements } from "@stripe/react-stripe-js";

const Register = () => {
  const [searchParams] = useSearchParams();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [conditionsChecked, setConditionsChecked] = useState(false);
  const [passwordChecked, setPasswordChecked] = useState(false);
  const { registerUser, loading, error } = useRegister();
  const navigate = useNavigate();
  const [registrationData, setRegistrationData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    plan: "",
    billingCycle: "", 
    paymentMethodId: ""
  });
  const [modalOpen, setModalOpen] = useState(false);
  const { createCheckoutSession } = useCheckoutSession();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setRegistrationData({
      ...registrationData,
      [id]: value,
    });

    if (id === "password") {
      if (!passwordChecked && value.length > 0) {
        setPasswordChecked(true);
      }
    }
  };

  const handleCheckboxChange = (e) => {
    setConditionsChecked(e.target.checked);
  };

  const handlePlanSelect = (plan, billingCycle) => {
    setRegistrationData((prevData) => ({
      ...prevData,
      plan,
      billingCycle,
    }));
    setModalOpen(false);
  };
  const stripe = useStripe();
  const elements = useElements();

// HANDLE SUBMIT *********************************************************************************************************
const handleSubmit = async (e) => {
  e.preventDefault();

  const selectedPlan = registrationData.plan ? registrationData.plan : "free";
  const selectedBillingCycle = registrationData.billingCycle ? registrationData.billingCycle : "monthly";

  const fullPlan = `${selectedPlan}_${selectedBillingCycle === "monthly" ? "monthly" : "annual"}`;

  if (!conditionsChecked) {
    alert("Debes aceptar los términos y condiciones para registrarte.");
    return;
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{5,}$/;
  if (!passwordRegex.test(registrationData.password)) {
    alert("La contraseña no cumple con los requisitos.");
    return;
  }

  if (registrationData.password !== registrationData.confirmPassword) {
    alert("Las contraseñas no coinciden");
    return;
  }

  const dataToSend = {
    username: registrationData.username,
    email: registrationData.email,
    password: registrationData.password,
    confirmPassword: registrationData.confirmPassword,
    plan: selectedPlan,
    billingCycle: selectedBillingCycle,
    paymentMethodId: registrationData.paymentMethodId,

  };

  const handleError = (err) => {
    if (err.response?.data?.error === "EMAIL_ALREADY_EXISTS") {
      setErrorMessage("Este correo ya está registrado.");
    } else if (err.response?.data?.error === "WEAK_PASSWORD") {
      setErrorMessage("La contraseña debe cumplir con los requisitos.");
    } else if (err.response?.data?.error === "PASSWORD_MISMATCH") {
      setErrorMessage("Las contraseñas no coinciden.");
    } else {
      setErrorMessage("Ocurrió un error inesperado. Intenta más tarde.");
    }
  };

  if (registrationData.plan === "free") {
  try {

    const res = await registerUser(dataToSend);

    if (res && res.message) {
      setSuccessMessage(res.message);
      setErrorMessage("");
      setTimeout(() => navigate("/login"), 3000);
    }
  } catch (err) {
    handleError(err);
  }
} 
else if (registrationData.plan === "pro" || registrationData.plan === "premium") {
  try {
    sessionStorage.setItem("userData", JSON.stringify(dataToSend));
    sessionStorage.setItem("selectedPlan", fullPlan);

    const { sessionId, url } = await createCheckoutSession({
      plan: fullPlan,
      billingCycle: registrationData.billingCycle,
      email: registrationData.email,
      username: registrationData.username,
      successUrl: `${window.location.origin}/register-success`,
      cancelUrl: `${window.location.origin}/register-cancel`,
    });

    if (sessionId && url) {
      sessionStorage.setItem("sessionId", sessionId);
      window.location.href = url;
    } else {
      setErrorMessage("Hubo un problema al crear la sesión de pago.");
    }
  } catch (err) {
    handleError(err);
  }
}
};

  useEffect(() => {
    const validPlans = ['free', 'pro', 'premium'];
    const validBillings = ['monthly', 'annual'];

    const selectedPlan = searchParams.get("plan");
    const selectedBilling = searchParams.get("billing");

    if (selectedPlan && !validPlans.includes(selectedPlan)) {
      setErrorMessage('El plan seleccionado es incorrecto. Debe ser uno de los siguientes: free, pro, premium.');
      setSuccessMessage('');
    } else if (selectedPlan) {
      setRegistrationData((prevData) => ({
        ...prevData,
        plan: selectedPlan,
      }));
      setErrorMessage('');
    }

    if (selectedBilling && !validBillings.includes(selectedBilling)) {
      setErrorMessage('El tipo de facturación seleccionado es incorrecto. Debe ser uno de los siguientes: monthly, annual.');
      setSuccessMessage('');
    } else if (selectedBilling) {
      setRegistrationData((prevData) => ({
        ...prevData,
        billingCycle: selectedBilling,
      }));
      setErrorMessage('');
    }

  }, [searchParams, errorMessage]); 
  
  return (
    <AuthLayout
      title="Registrarse"
      borderSrc={border}
      imageSrc={avatar}
      onSubmit={handleSubmit}
      className="mt-16 md:mt-5 lg:w-[70%] relative"
      formContent={
        <>
          <article className="flex flex-col-reverse md:flex-row w-full gap-2">
            <span className="w-full">
              <Input
                label={"Nombre de Usuario"}
                type="text"
                id="username"
                value={registrationData.username}
                onChange={handleChange}
                icon={<FaRegUser />}
                required
              />
            </span>
            <span className="w-full md:w-[70%] flex items-end p-0">
              <Input
                label={"Plan"}
                type="text"
                id="plan"
                value={`${registrationData?.plan || "free"} - ${registrationData?.billingCycle || "monthly"}`}
                className="rounded-r-none w-[14.1rem] md:w-full"
                readOnly
                required
              />
              <Button
                label="Cambiar"
                onClick={() => setModalOpen(true)}
                className="h-[2.6rem] m-0 px-4 md:px-2 text-xs rounded-none rounded-r-lg inputStyle items-center hover:brightness-125"
                variant="secondary"
              />
            </span>
          </article>
            <Input
              label={"Correo electrónico"}
              id="email"
              type="email"
              value={registrationData.email}
              onChange={handleChange}
              required
              icon={<MdAlternateEmail />}
            />

           <PasswordValidation
             password={registrationData.password}
             confirmPassword={registrationData.confirmPassword}
             onPasswordChange={handleChange}
             onConfirmPasswordChange={handleChange}
             passwordChecked={passwordChecked}
           />

          <section className="flex flex-col md:flex-row text-xs my-4">
            <article className="flex flex-row">
              <Input
                id="accept-terms"
                type="checkbox"
                label="Acepto los"
                checked={conditionsChecked}
                onChange={handleCheckboxChange}
                className="mt-0"
                required
              />
              <strong>
                <Button
                  label="Términos y Condiciones"
                  variant="link"
                  onClick={() => navigate("/conditions")}
                  className="ml-1 mt-2"
                />
              </strong>
            </article>
            <article className="flex flex-row ml-5 md:ml-0 mt-2">
              <span className="mx-1 grlTxt">y la</span>
              <strong>
                <Button
                  label="Política de Privacidad"
                  variant="link"
                  onClick={() => navigate("/privacy")}
                />
              </strong>
            </article>

          </section>

          <article
            className={`flex flex-col-reverse md:flex-row justify-between items-center rounded-md text-sm md:pl-2 w-full ${
              error || errorMessage ? " bg-red-100 w-full" : ""
            } ${successMessage ? " bg-green-100 " : ""} `}
          >
            <span>
              {error || errorMessage && (
                <p className=" text-red-700">{errorMessage}</p>
              )}
              {successMessage && (
                <p className=" text-green-700">{successMessage}</p>
              )}
              </span>
              <span className="w-full md:w-auto">
              <SubmitButton
                label="Registrarse"
                loading={loading}
                className="z-[2] w-full md:w-auto" 
              /></span>
          </article>

          <section className="flex flex-col md:flex-row justify-center items-center md:justify-start md:items-baseline w-full border-t-2 mt-5">
            <span className="labelInput">¿Ya tienes una Cuenta?</span>
            <span className="">
              <Button
                label="Inicia Sesión"
                variant="link"
                onClick={() => navigate("/login")}
                className="font-bold mt-5 md:ml-1"
              />
            </span>
          </section>
        <PricingModal isOpen={modalOpen} closeModal={() => setModalOpen(false)} handlePlanSelect={handlePlanSelect}/>
        </>
      }
      />
  );
};

export default Register;