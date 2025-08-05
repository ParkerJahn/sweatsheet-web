import Form from "../components/Form";

function Register() {
    return Form("/api/user/register/", "register");
}

export default Register;