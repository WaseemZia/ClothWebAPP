import { useEffect } from 'react';
import { HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SignalRNotifier = () => {
    useEffect(() => {
        // Connect to the backend SignalR hub (same base URL as your API)
        const connection = new HubConnectionBuilder()
            .withUrl("http://localhost:5034/stockHub")
            .withAutomaticReconnect()
            .build();

        // Start the connection
        const startConnection = async () => {
            try {
                await connection.start();
                console.log("SignalR Connected! Listening for stock alerts...");
            } catch (err) {
                console.error("SignalR Connection Error: ", err);
            }
        };

        startConnection();

        // Listen for stock alerts from the SalesController
        connection.on("ReceiveStockAlert", (alertData) => {
            if (alertData.isOutOfStock) {
                toast.error(alertData.message, {
                    position: "top-center",
                    autoClose: false,
                    theme: "colored"
                });
            } else {
                toast.warning(alertData.message, {
                    position: "top-center",
                    autoClose: 10000,
                    theme: "colored"
                });
            }
        });

        // Cleanup when component unmounts
        return () => {
            if (connection.state === HubConnectionState.Connected) {
                connection.stop();
            }
            connection.off("ReceiveStockAlert");
        };
    }, []);

    return <ToastContainer />;
};

export default SignalRNotifier;
