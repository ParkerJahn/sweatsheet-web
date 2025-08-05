import Form from "../components/Form";

function Login() {
    return Form("/api/token/", "login");
}

export default Login;