import React, { useState, useEffect } from "react";
import RoutineForm from "./RoutineForm";
import { useNavigate } from "react-router-dom";

const Dashboard = (props) => {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!props.loginStatus) {
      navigate("/login");
    }
  });

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="App">
      <div className="flex">
        <div className="weight container">
          <div className="dashboard flex">
            <h2>Weight</h2>
            <h1 id="plus" onClick={openModal}>
              +
            </h1>
          </div>
        </div>
        <div className="routine container">
          <div className="dashboard flex">
            <h2>Exercise Routines</h2>
            <h2 id="plus" onClick={openModal}>
              +
            </h2>
          </div>
        </div>
      </div>

      {showModal && (
        <RoutineForm loginStatus={props.loginStatus} onClose={closeModal} />
      )}
    </div>
  );
};

export default Dashboard;
