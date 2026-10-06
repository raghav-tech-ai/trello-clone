console.log("server running!");

const api = axios.create({
    baseURL:"http://localhost:3000"
});

api.interceptors.request.use((config)=>{
    const token = localStorage.getItem("token");
    if(token){
        config.headers.token=token;
    }
    return config;
});

api.interceptors.response.use(
    (response)=>response,
    (error)=>{
        if(error.response && error.response.status===403){
            window.location.href="signin.html";
        }
        return Promise.reject(error);
    }
);
