<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type");

$conn = new mysqli("localhost", "root", "", "crud_exemplo");

// Verifica conexão
if ($conn->connect_error) {
    die(json_encode(["status" => "erro", "msg" => "Falha na conexão"]));
}

// Se for GET → Lista usuários
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = $conn->query("SELECT * FROM usuarios");
    $usuarios = [];

    while ($row = $result->fetch_assoc()) {
        $usuarios[] = $row;
    }

    echo json_encode(["status" => "sucesso", "dados" => $usuarios]);
    exit;
}

// Se for POST → Cadastra usuário
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $nome = $conn->real_escape_string($data['nome']);
    $email = $conn->real_escape_string($data['email']);

    if ($conn->query("INSERT INTO usuario (nome, email) VALUES ('$nome', '$email')")) {
        echo json_encode(["status" => "sucesso", "msg" => "Usuário cadastrado"]);
    } else {
        echo json_encode(["status" => "erro", "msg" => "Erro ao cadastrar"]);
    }
    exit;
}

?>