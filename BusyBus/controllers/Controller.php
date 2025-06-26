<?php 
    require_once __DIR__ . '/../models/Model.php';

    header("Access-Control-Allow-Origin: *");
    header("Content-Type: application/json");
    header("Access-Control-Allow-Methods: POST, GET");
    header("Access-Control-Allow-Headers: Content-Type");
    
    $model = new Model();

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        
        switch ($input['request']) {
            case 'create':
                $name = $input['name'];
                $email = $input['email'];
                $password = $input['password'];
                $birthday = $input['birthday'];
                
                $response = $model->createUser($name, $email, $password, $birthday);
                
                echo $response;
                break;
            case 'login':
                $email = $input['email'];
                $password = $input['password'];

                $response = $model->loginUser($email, $password);
                
                echo $response;
                break;
        }
    }
?>