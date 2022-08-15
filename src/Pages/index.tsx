import { Box, CssBaseline, AppBar, Toolbar, IconButton, Typography, Divider, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import BookIcon from '@mui/icons-material/Book';
import { Link } from "react-router-dom";

import React from 'react'
import { Outlet } from 'react-router-dom';
const drawerWidth = 240;
interface Props {
    /**
     * Injected by the documentation to work in an iframe.
     * You won't need it on your project.
     */
    window?: () => Window;
}

const MenuDrawer: React.FC = () => (
    <div>
        <Toolbar />
        <Divider />
        <List>
            <ListItem key="users" disablePadding>
                <Link to="/users" className='w-100' style={{ color: "#000", textDecoration: "none" }}>
                    <ListItemButton>
                        <ListItemIcon>
                            <PeopleAltRoundedIcon />
                        </ListItemIcon>
                        <ListItemText primary="All Users" />
                    </ListItemButton>
                </Link>
            </ListItem>
            <ListItem key="logs" disablePadding>
                <Link to="/logs/all" className='w-100' style={{ color: "#000", textDecoration: "none" }}>
                    <ListItemButton>
                        <ListItemIcon>
                            <BookIcon />
                        </ListItemIcon>
                        <ListItemText primary="Accessc Logs" />
                    </ListItemButton>
                </Link>
            </ListItem>
        </List>
    </div>
);

const MainPanel = (props: Props) => {
    const { window } = props;
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };
    const container = window !== undefined ? () => window().document.body : undefined;


    return (
        <>
            <Box sx={{ display: 'flex' }}>
                <CssBaseline />
                <AppBar
                    position="fixed"
                    sx={{
                        width: { sm: `calc(100% - ${drawerWidth}px)` },
                        ml: { sm: `${drawerWidth}px` },
                    }}
                >
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2, display: { sm: 'none' } }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" noWrap component="div">
                            Responsive drawer
                        </Typography>
                    </Toolbar>
                </AppBar>
                <Box
                    component="nav"
                    sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                    aria-label="mailbox folders"
                >
                    <Drawer
                        container={container}
                        variant="temporary"
                        open={mobileOpen}
                        onClose={handleDrawerToggle}
                        ModalProps={{
                            keepMounted: true, // Better open performance on mobile.
                        }}
                        sx={{
                            display: { xs: 'block', sm: 'none' },
                            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                        }}
                    >
                        <MenuDrawer />
                    </Drawer>
                    <Drawer
                        variant="permanent"
                        sx={{
                            display: { xs: 'none', sm: 'block' },
                            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                        }}
                        open
                    >
                        <MenuDrawer />
                    </Drawer>

                </Box>
                <Box
                    component="main"
                    sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
                >
                    <Toolbar />
                    <Outlet />
                </Box>
            </Box>
        </>
    )
}

export default MainPanel;
