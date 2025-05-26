// For future dynamic behavior, like fetching sensor data
document.addEventListener("DOMContentLoaded", function () {
    console.log("Dashboard loaded successfully!");
    // Example to show class status update dynamically
    let class4 = document.getElementById('class4');
    class4.querySelector('.status').textContent = 'Peringatan: Gas CO2 tinggi!';
});
