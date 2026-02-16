import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ForumIcon from '@mui/icons-material/ForumOutlined'

export function EmptyFeedState() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 10,
        px: 2,
        textAlign: 'center',
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px dashed',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
        }}
      >
        <ForumIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
      </Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        No feeds yet
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
        Be the first one to share something with the community! Use the form
        above to post your first feed.
      </Typography>
    </Box>
  )
}
