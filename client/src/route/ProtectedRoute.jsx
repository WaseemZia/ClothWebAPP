import { Children, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({Children,allowedRoles})=>{
    const {isAuthenicated,role}=useContext(AuthContext);
    if(!isAuthenicated)
    {
        return <Navigate to="/login"replace/>
    }
// If they are logged in but don't have the right role (e.g. Cashier trying to open Inventory)
    if(allowedRoles && !allowedRoles.includes(role)){
        return <Navigate to='/sales' replace/>
    }
     // If they are allowed, let them see the page!
  return Children;
}

export default ProtectedRoute;