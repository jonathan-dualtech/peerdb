package activities

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/PeerDB-io/peerdb/flow/generated/protos"
)

func TestDescribeSchemaDelta(t *testing.T) {
	require.Empty(t, describeSchemaDelta(&protos.TableSchemaDelta{SrcTableName: "public.t"}))
	require.Equal(t, "schema change on public.t: added a int4, dropped b, renamed c to d, changed e to int8",
		describeSchemaDelta(&protos.TableSchemaDelta{
			SrcTableName:   "public.t",
			AddedColumns:   []*protos.FieldDescription{{Name: "a", Type: "int4"}},
			DroppedColumns: []string{"b"},
			RenamedColumns: []*protos.RenamedColumn{{OldName: "c", NewName: "d"}},
			ChangedColumns: []*protos.FieldDescription{{Name: "e", Type: "int8"}},
		}))
}
