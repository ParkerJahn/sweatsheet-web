import Header from "./components/Header";
import Footer from "./components/Footer";
import AvailabilityCalendar from "./components/AvailabilityCalendar";
import './index.css';


function App() {

  
  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white">
      <Header />
      <AvailabilityCalendar />
      <Footer />
    </div>
  );

}

export default App;