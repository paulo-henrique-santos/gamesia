export default function Cabecalho() {
    return (
        <header 
        className="bg-gray-800 text-white flex flex-col justify-center items-center flex-1 p-6 overflow-y-auto relative"
        style={{
            backgroundImage: "url('/cabecalho.png')",
            backgroundSize: "13%",
            backgroundPosition: "50% 0%",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed",
        }}
        >
            <h1>GamesIA</h1>
            <p>Faça um questionário sobre games para testar seus conhecimentos!</p>
        </header>
    )
}