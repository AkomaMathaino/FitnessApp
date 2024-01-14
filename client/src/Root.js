import React from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import Axios from "axios";

const Root = (props) => {
  const { setLoginStatus, apiURL } = props;
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    Axios.delete(`${apiURL}/api/logout`).then((response) => {
      if (response.status === 200) {
        setLoginStatus("");
        localStorage.clear();
        navigate("/");
      }
    });
  };

  return (
    <>
      <div className="nav">
        {localStorage.getItem("authToken") ? (
          <>
            <h1 className="name">
              Hello, {JSON.parse(localStorage.getItem("authToken")).firstName}!
            </h1>
            <Link
              className={location.pathname === "/dashboard" ? "active" : ""}
              to="/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className={location.pathname === "/profile" ? "active" : ""}
              to="/profile"
            >
              Profile
            </Link>
            <Link to="/logout" onClick={logout}>
              Logout
            </Link>
          </>
        ) : (
          <>
            <Link
              className={location.pathname === "/login" ? "active" : ""}
              to="/login"
            >
              Login
            </Link>
            <Link
              className={location.pathname === "/register" ? "active" : ""}
              to="/register"
            >
              Register
            </Link>
          </>
        )}
      </div>

      <div>
        <Outlet />
      </div>
    </>
  );
};

export default Root;
