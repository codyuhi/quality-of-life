import { useState } from 'react'
import 'App.css';
import Navbar from 'components/Navbar';
import Sidebar from 'components/Sidebar';
import Content from 'components/Content';
import Footer from 'components/Footer';

function App() {
    const [searchTerm, setSearchTerm] = useState('')
    return (
        <div className="App">
            <Navbar updateSearchTerm={setSearchTerm} searchTerm={searchTerm} />
            <Sidebar />
            <Content updateSearchTerm={setSearchTerm} searchTerm={searchTerm} />
            <Footer />
        </div>
    );
}

export default App;